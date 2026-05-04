import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContactRequestStatus, CVVisibility, UserRole } from '@prisma/client';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { PrismaService } from '../prisma/prisma.service';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Injectable()
export class ContactRequestsService {
  constructor(private readonly prisma: PrismaService) {}

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

    const existingPendingRequest = await this.prisma.contactRequest.findFirst({
      where: {
        employerId: user.id,
        candidateId: dto.candidateId,
        status: ContactRequestStatus.PENDING,
      },
    });

    if (existingPendingRequest) {
      throw new BadRequestException(
        'A pending contact request already exists for this candidate.',
      );
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
}
