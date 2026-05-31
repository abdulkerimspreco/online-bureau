import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CvModerationStatus,
  CVVisibility,
  NotificationType,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CvService } from '../cv/cv.service';
import { CreateCvModerationCaseDto } from './dto/create-cv-moderation-case.dto';
import {
  ModerationDecision,
  RespondCvModerationCaseDto,
} from './dto/respond-cv-moderation-case.dto';
import {
  ModerationOutcome,
  ResolveCvModerationCaseDto,
} from './dto/resolve-cv-moderation-case.dto';
import { ListCvModerationCandidatesDto } from './dto/list-cv-moderation-candidates.dto';

@Injectable()
export class AdminCvModerationService {
  private static readonly ACTIVE_CASE_STATUSES: CvModerationStatus[] = [
    CvModerationStatus.AWAITING_CONSENT,
    CvModerationStatus.PREVIEW_GRANTED,
    CvModerationStatus.DECLINED,
  ];
  private static readonly RESOLVABLE_CASE_STATUSES: CvModerationStatus[] = [
    CvModerationStatus.PREVIEW_GRANTED,
    CvModerationStatus.DECLINED,
  ];

  private static readonly CONSENT_WINDOW_HOURS = 72;
  private static readonly PREVIEW_WINDOW_MINUTES = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly cvService: CvService,
  ) {}

  async listCandidates(dto: ListCvModerationCandidatesDto) {
    const query = dto.query?.trim();

    const candidates = await this.prisma.cv.findMany({
      where: {
        user: {
          role: UserRole.JOB_SEEKER,
          ...(query
            ? {
                OR: [
                  {
                    email: {
                      contains: query,
                      mode: 'insensitive',
                    },
                  },
                  {
                    jobSeekerProfile: {
                      is: {
                        displayName: {
                          contains: query,
                          mode: 'insensitive',
                        },
                      },
                    },
                  },
                  {
                    jobSeekerProfile: {
                      is: {
                        location: {
                          contains: query,
                          mode: 'insensitive',
                        },
                      },
                    },
                  },
                ],
              }
            : {}),
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            jobSeekerProfile: true,
          },
        },
        moderationCases: {
          where: {
            status: {
              in: AdminCvModerationService.ACTIVE_CASE_STATUSES,
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          include: {
            flaggedByAdmin: {
              select: {
                email: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();

    return candidates.map((candidate) => {
      const activeCase = candidate.moderationCases[0] ?? null;

      return {
        candidateId: candidate.user.id,
        cvId: candidate.id,
        displayName:
          candidate.user.jobSeekerProfile?.displayName ?? 'Unnamed candidate',
        email: candidate.user.email,
        location: candidate.user.jobSeekerProfile?.location ?? '—',
        visibility: candidate.visibility,
        uploadedAt: candidate.updatedAt,
        activeCase: activeCase
          ? {
              id: activeCase.id,
              status: activeCase.status,
              reason: activeCase.reason,
              createdAt: activeCase.createdAt,
              consentDeadlineAt: activeCase.consentDeadlineAt,
              previewExpiresAt: activeCase.previewExpiresAt,
              flaggedByAdminEmail: activeCase.flaggedByAdmin.email,
              isConsentExpired:
                activeCase.status === CvModerationStatus.AWAITING_CONSENT &&
                activeCase.consentDeadlineAt < now,
              isPreviewExpired:
                activeCase.status === CvModerationStatus.PREVIEW_GRANTED &&
                Boolean(
                  activeCase.previewExpiresAt &&
                    activeCase.previewExpiresAt < now,
                ),
            }
          : null,
      };
    });
  }

  async createCase(adminId: string, dto: CreateCvModerationCaseDto) {
    const candidateCv = await this.prisma.cv.findFirst({
      where: {
        userId: dto.candidateId,
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
      throw new NotFoundException('Candidate CV not found.');
    }

    const existingCase = await this.prisma.cvModerationCase.findFirst({
      where: {
        candidateId: dto.candidateId,
        status: {
          in: AdminCvModerationService.ACTIVE_CASE_STATUSES,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingCase) {
      throw new BadRequestException(
        'An active moderation case already exists for this candidate.',
      );
    }

    const consentDeadlineAt = new Date();
    consentDeadlineAt.setHours(
      consentDeadlineAt.getHours() +
        AdminCvModerationService.CONSENT_WINDOW_HOURS,
    );

    const reason = dto.reason?.trim() || null;
    const previousVisibility =
      candidateCv.visibility === CVVisibility.PRIVATE
        ? null
        : candidateCv.visibility;

    const createdCase = await this.prisma.$transaction(async (tx) => {
      await tx.cv.update({
        where: {
          id: candidateCv.id,
        },
        data: {
          visibility: CVVisibility.PRIVATE,
        },
      });

      return tx.cvModerationCase.create({
        data: {
          candidateId: dto.candidateId,
          cvId: candidateCv.id,
          flaggedByAdminId: adminId,
          reason,
          previousVisibility,
          consentDeadlineAt,
        },
        include: {
          candidate: {
            include: {
              jobSeekerProfile: true,
            },
          },
        },
      });
    });

    await this.prisma.adminActionLog.create({
      data: {
        adminId,
        targetUserId: dto.candidateId,
        action: 'CV_MODERATION_FLAGGED',
      },
    });

    await this.notificationsService.create({
      userId: dto.candidateId,
      type: NotificationType.CV_MODERATION_REVIEW_REQUESTED,
      title: 'CV review requested',
      message: `An admin flagged your CV for moderation review. It is now hidden while you decide whether to allow a 30-minute preview within the next 72 hours.${reason ? ` Reason: ${reason}` : ''}`,
      linkUrl: '/job-seeker/cv-moderation',
    });

    return {
      id: createdCase.id,
      candidateId: createdCase.candidateId,
      candidateName:
        createdCase.candidate.jobSeekerProfile?.displayName ?? 'Candidate',
      status: createdCase.status,
      reason: createdCase.reason,
      consentDeadlineAt: createdCase.consentDeadlineAt,
      createdAt: createdCase.createdAt,
    };
  }

  async listCasesForAdmin(adminId: string) {
    const cases = await this.prisma.cvModerationCase.findMany({
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

    const now = new Date();

    return cases.map((caseItem) => ({
      id: caseItem.id,
      candidateId: caseItem.candidateId,
      candidateName:
        caseItem.candidate.jobSeekerProfile?.displayName ?? 'Candidate',
      candidateEmail: caseItem.candidate.email,
      location: caseItem.candidate.jobSeekerProfile?.location ?? '—',
      flaggedByCurrentAdmin: caseItem.flaggedByAdminId === adminId,
      status: caseItem.status,
      reason: caseItem.reason,
      previousVisibility: caseItem.previousVisibility,
      consentDeadlineAt: caseItem.consentDeadlineAt,
      candidateRespondedAt: caseItem.candidateRespondedAt,
      previewGrantedAt: caseItem.previewGrantedAt,
      previewExpiresAt: caseItem.previewExpiresAt,
      resolvedAt: caseItem.resolvedAt,
      createdAt: caseItem.createdAt,
      updatedAt: caseItem.updatedAt,
      canPreview:
        caseItem.flaggedByAdminId === adminId &&
        caseItem.status === CvModerationStatus.PREVIEW_GRANTED &&
        Boolean(caseItem.previewExpiresAt && caseItem.previewExpiresAt > now),
      canResolve:
        caseItem.flaggedByAdminId === adminId &&
        AdminCvModerationService.RESOLVABLE_CASE_STATUSES.includes(
          caseItem.status,
        ),
      isConsentExpired:
        caseItem.status === CvModerationStatus.AWAITING_CONSENT &&
        caseItem.consentDeadlineAt < now,
      isPreviewExpired:
        caseItem.status === CvModerationStatus.PREVIEW_GRANTED &&
        Boolean(caseItem.previewExpiresAt && caseItem.previewExpiresAt < now),
    }));
  }

  async getPreviewFile(adminId: string, caseId: string) {
    const caseItem = await this.prisma.cvModerationCase.findFirst({
      where: {
        id: caseId,
        flaggedByAdminId: adminId,
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Moderation case not found.');
    }

    if (caseItem.status !== CvModerationStatus.PREVIEW_GRANTED) {
      throw new ForbiddenException('Candidate consent has not granted preview access.');
    }

    if (!caseItem.previewExpiresAt || caseItem.previewExpiresAt < new Date()) {
      throw new ForbiddenException('The preview window has expired.');
    }

    const file = await this.cvService.getCvFileForUser(caseItem.candidateId);

    await this.prisma.adminActionLog.create({
      data: {
        adminId,
        targetUserId: caseItem.candidateId,
        action: 'CV_MODERATION_PREVIEW_ACCESSED',
      },
    });

    return file;
  }

  async listCasesForCandidate(candidateId: string) {
    const cases = await this.prisma.cvModerationCase.findMany({
      where: {
        candidateId,
      },
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        flaggedByAdmin: {
          select: {
            email: true,
          },
        },
      },
    });

    const now = new Date();

    return cases.map((caseItem) => ({
      id: caseItem.id,
      status: caseItem.status,
      reason: caseItem.reason,
      adminEmail: caseItem.flaggedByAdmin.email,
      consentDeadlineAt: caseItem.consentDeadlineAt,
      candidateRespondedAt: caseItem.candidateRespondedAt,
      previewExpiresAt: caseItem.previewExpiresAt,
      previousVisibility: caseItem.previousVisibility,
      resolvedAt: caseItem.resolvedAt,
      createdAt: caseItem.createdAt,
      updatedAt: caseItem.updatedAt,
      canRespond:
        caseItem.status === CvModerationStatus.AWAITING_CONSENT &&
        caseItem.consentDeadlineAt > now,
      isConsentExpired:
        caseItem.status === CvModerationStatus.AWAITING_CONSENT &&
        caseItem.consentDeadlineAt <= now,
    }));
  }

  async respondToCase(
    candidateId: string,
    caseId: string,
    dto: RespondCvModerationCaseDto,
  ) {
    const caseItem = await this.prisma.cvModerationCase.findFirst({
      where: {
        id: caseId,
        candidateId,
      },
      include: {
        candidate: {
          include: {
            jobSeekerProfile: true,
          },
        },
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Moderation case not found.');
    }

    if (caseItem.status !== CvModerationStatus.AWAITING_CONSENT) {
      throw new BadRequestException('This moderation case has already been processed.');
    }

    if (caseItem.consentDeadlineAt <= new Date()) {
      throw new BadRequestException('The consent window has expired for this moderation case.');
    }

    const nextStatus =
      dto.decision === 'CONSENT'
        ? CvModerationStatus.PREVIEW_GRANTED
        : CvModerationStatus.DECLINED;

    const previewGrantedAt =
      dto.decision === 'CONSENT' ? new Date() : null;
    const previewExpiresAt =
      dto.decision === 'CONSENT'
        ? new Date(
            previewGrantedAt!.getTime() +
              AdminCvModerationService.PREVIEW_WINDOW_MINUTES * 60 * 1000,
          )
        : null;

    const updatedCase = await this.prisma.cvModerationCase.update({
      where: {
        id: caseItem.id,
      },
      data: {
        status: nextStatus,
        candidateRespondedAt: new Date(),
        previewGrantedAt,
        previewExpiresAt,
      },
      include: {
        candidate: {
          include: {
            jobSeekerProfile: true,
          },
        },
      },
    });

    await this.prisma.adminActionLog.create({
      data: {
        adminId: updatedCase.flaggedByAdminId,
        targetUserId: candidateId,
        action:
          dto.decision === 'CONSENT'
            ? 'CV_MODERATION_CONSENT_GRANTED'
            : 'CV_MODERATION_CONSENT_DECLINED',
      },
    });

    const candidateName =
      updatedCase.candidate.jobSeekerProfile?.displayName ?? 'Candidate';

    await this.notificationsService.create({
      userId: updatedCase.flaggedByAdminId,
      type:
        dto.decision === 'CONSENT'
          ? NotificationType.CV_MODERATION_CONSENT_GRANTED
          : NotificationType.CV_MODERATION_CONSENT_DECLINED,
      title:
        dto.decision === 'CONSENT'
          ? 'CV preview approved'
          : 'CV preview declined',
      message:
        dto.decision === 'CONSENT'
          ? `${candidateName} allowed a 30-minute admin preview of their CV.`
          : `${candidateName} declined admin preview of their CV.`,
      linkUrl: '/admin/cv-moderation',
    });

    return {
      id: updatedCase.id,
      status: updatedCase.status,
      candidateRespondedAt: updatedCase.candidateRespondedAt,
      previewExpiresAt: updatedCase.previewExpiresAt,
    };
  }

  async resolveCase(
    adminId: string,
    caseId: string,
    dto: ResolveCvModerationCaseDto,
  ) {
    const caseItem = await this.prisma.cvModerationCase.findFirst({
      where: {
        id: caseId,
        flaggedByAdminId: adminId,
      },
      include: {
        candidate: {
          include: {
            jobSeekerProfile: true,
          },
        },
        cv: true,
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Moderation case not found.');
    }

    if (
      !AdminCvModerationService.RESOLVABLE_CASE_STATUSES.includes(
        caseItem.status,
      )
    ) {
      throw new BadRequestException('This moderation case cannot be resolved yet.');
    }

    const resolvedStatus =
      dto.action === 'DISMISS'
        ? CvModerationStatus.DISMISSED
        : CvModerationStatus.ESCALATED;
    const restoreVisibility =
      dto.action === 'DISMISS' &&
      caseItem.previousVisibility &&
      caseItem.cv.visibility === CVVisibility.PRIVATE;

    const updatedCase = await this.prisma.$transaction(async (tx) => {
      if (restoreVisibility) {
        await tx.cv.update({
          where: {
            id: caseItem.cvId,
          },
          data: {
            visibility: caseItem.previousVisibility ?? CVVisibility.PRIVATE,
          },
        });
      }

      return tx.cvModerationCase.update({
        where: {
          id: caseItem.id,
        },
        data: {
          status: resolvedStatus,
          resolvedAt: new Date(),
        },
      });
    });

    await this.prisma.adminActionLog.create({
      data: {
        adminId,
        targetUserId: caseItem.candidateId,
        action:
          dto.action === 'DISMISS'
            ? 'CV_MODERATION_DISMISSED'
            : 'CV_MODERATION_ESCALATED',
      },
    });

    const candidateName =
      caseItem.candidate.jobSeekerProfile?.displayName ?? 'candidate';

    await this.notificationsService.create({
      userId: caseItem.candidateId,
      type:
        dto.action === 'DISMISS'
          ? NotificationType.CV_MODERATION_DISMISSED
          : NotificationType.CV_MODERATION_ESCALATED,
      title:
        dto.action === 'DISMISS'
          ? 'CV review dismissed'
          : 'CV review escalated',
      message:
        dto.action === 'DISMISS'
          ? `${candidateName}, an admin closed your CV moderation case.${restoreVisibility ? ' Your previous visibility setting has been restored.' : ''}`
          : `${candidateName}, an admin escalated your CV moderation case for follow-up while your CV remains hidden.`,
      linkUrl: '/job-seeker/cv-moderation',
    });

    return {
      id: updatedCase.id,
      status: updatedCase.status,
      resolvedAt: updatedCase.resolvedAt,
      visibilityRestored: Boolean(restoreVisibility),
    };
  }
}
