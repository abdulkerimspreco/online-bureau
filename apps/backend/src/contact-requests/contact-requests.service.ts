import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContactRequestStatus,
  CVVisibility,
  NotificationType,
  UserRole,
} from '@prisma/client';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import {
  ContactRequestDecision,
  RespondContactRequestDto,
} from './dto/respond-contact-request.dto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Injectable()
export class ContactRequestsService {
  private static readonly DECLINE_COOLDOWN_DAYS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createForEmployer(user: AuthUser, dto: CreateContactRequestDto) {
    if (!user.isVerified) {
      throw new ForbiddenException(
        'Please verify your email before sending contact requests.',
      );
    }

    if (dto.candidateId === user.id) {
      throw new BadRequestException(
        'You cannot send a contact request to your own account.',
      );
    }

    const candidateCv = await this.prisma.cv.findFirst({
      where: {
        userId: dto.candidateId,
        visibility: {
          in: [CVVisibility.PUBLIC, CVVisibility.COMPANY_ONLY],
        },
        user: {
          role: UserRole.JOB_SEEKER,
          jobSeekerProfile: {
            isNot: null,
          },
          mutedCompanies: {
            none: {
              employerId: user.id,
            },
          },
        },
      },
      include: {
        user: {
          include: {
            jobSeekerProfile: true,
          },
        },
      },
    });

    if (!candidateCv) {
      throw new NotFoundException(
        'Candidate profile is not available for contact requests.',
      );
    }

    const latestExistingRequest = await this.prisma.contactRequest.findFirst({
      where: {
        employerId: user.id,
        candidateId: dto.candidateId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    if (latestExistingRequest?.status === ContactRequestStatus.PENDING) {
      throw new BadRequestException(
        'A pending contact request already exists for this candidate.',
      );
    }

    if (latestExistingRequest?.status === ContactRequestStatus.ACCEPTED) {
      throw new BadRequestException(
        'This candidate has already accepted your contact request.',
      );
    }

    if (latestExistingRequest?.status === ContactRequestStatus.DECLINED) {
      const canRequestAgainAt = new Date(latestExistingRequest.updatedAt);
      canRequestAgainAt.setDate(
        canRequestAgainAt.getDate() +
          ContactRequestsService.DECLINE_COOLDOWN_DAYS,
      );

      if (canRequestAgainAt > new Date()) {
        throw new BadRequestException(
          `This candidate declined your previous contact request. You can try again after ${canRequestAgainAt.toLocaleDateString()}.`,
        );
      }
    }

    const message = dto.message?.trim() || null;

    const contactRequest = await this.prisma.contactRequest.create({
      data: {
        employerId: user.id,
        candidateId: dto.candidateId,
        message,
      },
      include: {
        employer: {
          include: {
            employerProfile: true,
          },
        },
        candidate: {
          include: {
            jobSeekerProfile: true,
          },
        },
      },
    });

    console.log(
      `Contact request email preview for ${candidateCv.user.email}: ${user.email} requested contact with ${candidateCv.user.jobSeekerProfile?.displayName ?? 'candidate'}${message ? ` with message: ${message}` : '.'}`,
    );

    const employerName =
      contactRequest.employer.employerProfile?.companyName ?? 'An employer';
    const candidateName =
      contactRequest.candidate.jobSeekerProfile?.displayName ?? 'your profile';

    await this.notificationsService.create({
      userId: contactRequest.candidate.id,
      type: NotificationType.CONTACT_REQUEST_SENT,
      title: 'New contact request',
      message: `${employerName} sent you a contact request for ${candidateName}.`,
      linkUrl: '/job-seeker/dashboard',
    });

    return {
      id: contactRequest.id,
      status: contactRequest.status,
      createdAt: contactRequest.createdAt,
      message: contactRequest.message,
      candidate: {
        id: contactRequest.candidate.id,
        displayName:
          contactRequest.candidate.jobSeekerProfile?.displayName ??
          'Anonymous candidate',
      },
    };
  }

  async getPendingForCandidate(candidateId: string) {
    const requests = await this.prisma.contactRequest.findMany({
      where: {
        candidateId,
        status: ContactRequestStatus.PENDING,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        employer: {
          include: {
            employerProfile: true,
          },
        },
      },
    });

    return requests.map((request) => ({
      id: request.id,
      employerId: request.employerId,
      companyName:
        request.employer.employerProfile?.companyName ?? 'Unknown employer',
      message: request.message,
      createdAt: request.createdAt,
      status: request.status,
    }));
  }

  async getHistoryForCandidate(candidateId: string) {
    const requests = await this.prisma.contactRequest.findMany({
      where: {
        candidateId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        employer: {
          select: {
            id: true,
            email: true,
            employerProfile: true,
          },
        },
      },
    });

    return requests.map((request) => ({
      id: request.id,
      employerId: request.employerId,
      companyName:
        request.employer.employerProfile?.companyName ?? 'Unknown employer',
      employerEmail: request.employer.email,
      message: request.message,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    }));
  }

  async respondToCandidateRequest(
    candidateId: string,
    requestId: string,
    dto: RespondContactRequestDto,
  ) {
    const request = await this.prisma.contactRequest.findFirst({
      where: {
        id: requestId,
        candidateId,
      },
      include: {
        employer: {
          include: {
            employerProfile: true,
          },
        },
        candidate: {
          include: {
            jobSeekerProfile: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Contact request not found.');
    }

    if (request.status !== ContactRequestStatus.PENDING) {
      throw new BadRequestException(
        'This contact request has already been processed.',
      );
    }

    const status =
      dto.action === ContactRequestDecision.ACCEPT
        ? ContactRequestStatus.ACCEPTED
        : ContactRequestStatus.DECLINED;

    const updatedRequest = await this.prisma.contactRequest.update({
      where: {
        id: requestId,
      },
      data: {
        status,
      },
      include: {
        employer: {
          include: {
            employerProfile: true,
          },
        },
        candidate: {
          select: {
            id: true,
            email: true,
            jobSeekerProfile: true,
          },
        },
      },
    });

    const candidateName =
      updatedRequest.candidate.jobSeekerProfile?.displayName ?? 'candidate';
    const employerName =
      updatedRequest.employer.employerProfile?.companyName ?? 'Employer';

    console.log(
      `Contact request ${status.toLowerCase()} email preview for ${updatedRequest.employer.email}: ${candidateName} has ${status === ContactRequestStatus.ACCEPTED ? 'accepted' : 'declined'} your contact request from ${employerName}.`,
    );

    await this.notificationsService.create({
      userId: updatedRequest.employerId,
      type:
        status === ContactRequestStatus.ACCEPTED
          ? NotificationType.CONTACT_REQUEST_ACCEPTED
          : NotificationType.CONTACT_REQUEST_DECLINED,
      title:
        status === ContactRequestStatus.ACCEPTED
          ? 'Contact request accepted'
          : 'Contact request declined',
      message:
        status === ContactRequestStatus.ACCEPTED
          ? `${candidateName} accepted your contact request.`
          : `${candidateName} declined your contact request.`,
      linkUrl:
        status === ContactRequestStatus.ACCEPTED
          ? `/employer/candidates/${updatedRequest.candidate.id}`
          : '/employer/requests',
    });

    return {
      id: updatedRequest.id,
      status: updatedRequest.status,
      candidate: {
        id: updatedRequest.candidate.id,
        displayName: candidateName,
        email:
          updatedRequest.status === ContactRequestStatus.ACCEPTED
            ? updatedRequest.candidate.email
            : null,
      },
      employer: {
        id: updatedRequest.employerId,
        companyName: employerName,
      },
      updatedAt: updatedRequest.updatedAt,
    };
  }

  async getHistoryForEmployer(employerId: string) {
    const requests = await this.prisma.contactRequest.findMany({
      where: {
        employerId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            jobSeekerProfile: true,
          },
        },
      },
    });

    return requests.map((request) => {
      let canRequestAgainAt: Date | null = null;

      if (request.status === ContactRequestStatus.DECLINED) {
        canRequestAgainAt = new Date(request.updatedAt);
        canRequestAgainAt.setDate(
          canRequestAgainAt.getDate() +
            ContactRequestsService.DECLINE_COOLDOWN_DAYS,
        );
      }

      return {
        id: request.id,
        candidateId: request.candidateId,
        candidateDisplayName:
          request.candidate.jobSeekerProfile?.displayName ??
          'Anonymous candidate',
        candidateLocation: request.candidate.jobSeekerProfile?.location ?? '',
        candidateEmail:
          request.status === ContactRequestStatus.ACCEPTED
            ? request.candidate.email
            : null,
        message: request.message,
        status: request.status,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
        canRequestAgainAt,
      };
    });
  }
}
