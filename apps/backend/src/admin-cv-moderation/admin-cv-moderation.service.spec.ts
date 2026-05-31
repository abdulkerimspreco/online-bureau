import {
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CvModerationStatus,
  CVVisibility,
  NotificationType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CvService } from '../cv/cv.service';
import { AdminCvModerationService } from './admin-cv-moderation.service';

type MockedPrisma = {
  cv: {
    findFirst: jest.Mock;
    update: jest.Mock;
  };
  cvModerationCase: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  adminActionLog: {
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('AdminCvModerationService', () => {
  let service: AdminCvModerationService;
  let prisma: MockedPrisma;
  let notificationsService: { create: jest.Mock };
  let cvService: { getCvFileForUser: jest.Mock };

  beforeEach(() => {
    prisma = {
      cv: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      cvModerationCase: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      adminActionLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    notificationsService = {
      create: jest.fn(),
    };

    cvService = {
      getCvFileForUser: jest.fn(),
    };

    service = new AdminCvModerationService(
      prisma as unknown as PrismaService,
      notificationsService as unknown as NotificationsService,
      cvService as unknown as CvService,
    );
  });

  it('flags a candidate CV and hides it immediately', async () => {
    const createdCase = {
      id: 'case-1',
      candidateId: 'cand-1',
      status: CvModerationStatus.AWAITING_CONSENT,
      reason: 'Possible mismatch',
      consentDeadlineAt: new Date('2026-05-31T10:00:00.000Z'),
      createdAt: new Date('2026-05-28T10:00:00.000Z'),
      candidate: {
        jobSeekerProfile: {
          displayName: 'Sara',
        },
      },
    };

    prisma.cv.findFirst.mockResolvedValue({
      id: 'cv-1',
      userId: 'cand-1',
      visibility: CVVisibility.PUBLIC,
      user: {
        jobSeekerProfile: {
          displayName: 'Sara',
        },
      },
    });
    prisma.cvModerationCase.findFirst.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        cv: {
          update: jest.fn(),
        },
        cvModerationCase: {
          create: jest.fn().mockResolvedValue(createdCase),
        },
      }),
    );

    const result = await service.createCase('admin-1', {
      candidateId: 'cand-1',
      reason: 'Possible mismatch',
    });

    expect(result.status).toBe(CvModerationStatus.AWAITING_CONSENT);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'cand-1',
        type: NotificationType.CV_MODERATION_REVIEW_REQUESTED,
      }),
    );
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-1',
        targetUserId: 'cand-1',
        action: 'CV_MODERATION_FLAGGED',
      },
    });
  });

  it('grants a 30-minute preview window when candidate consents', async () => {
    prisma.cvModerationCase.findFirst.mockResolvedValue({
      id: 'case-1',
      candidateId: 'cand-1',
      flaggedByAdminId: 'admin-1',
      status: CvModerationStatus.AWAITING_CONSENT,
      consentDeadlineAt: new Date(Date.now() + 60 * 60 * 1000),
      candidate: {
        jobSeekerProfile: {
          displayName: 'Sara',
        },
      },
    });
    prisma.cvModerationCase.update.mockResolvedValue({
      id: 'case-1',
      flaggedByAdminId: 'admin-1',
      status: CvModerationStatus.PREVIEW_GRANTED,
      candidateRespondedAt: new Date(),
      previewExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
      candidate: {
        jobSeekerProfile: {
          displayName: 'Sara',
        },
      },
    });

    const result = await service.respondToCase('cand-1', 'case-1', {
      decision: 'CONSENT',
    });

    expect(result.status).toBe(CvModerationStatus.PREVIEW_GRANTED);
    expect(notificationsService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'admin-1',
        type: NotificationType.CV_MODERATION_CONSENT_GRANTED,
      }),
    );
  });

  it('blocks preview access after the preview window expires', async () => {
    prisma.cvModerationCase.findFirst.mockResolvedValue({
      id: 'case-1',
      candidateId: 'cand-1',
      flaggedByAdminId: 'admin-1',
      status: CvModerationStatus.PREVIEW_GRANTED,
      previewExpiresAt: new Date(Date.now() - 60 * 1000),
    });

    await expect(
      service.getPreviewFile('admin-1', 'case-1'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('restores visibility when an admin dismisses the case', async () => {
    prisma.cvModerationCase.findFirst.mockResolvedValue({
      id: 'case-1',
      candidateId: 'cand-1',
      flaggedByAdminId: 'admin-1',
      status: CvModerationStatus.DECLINED,
      previousVisibility: CVVisibility.PUBLIC,
      cvId: 'cv-1',
      cv: {
        id: 'cv-1',
        visibility: CVVisibility.PRIVATE,
      },
      candidate: {
        jobSeekerProfile: {
          displayName: 'Sara',
        },
      },
    });
    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        cv: {
          update: jest.fn(),
        },
        cvModerationCase: {
          update: jest.fn().mockResolvedValue({
            id: 'case-1',
            status: CvModerationStatus.DISMISSED,
            resolvedAt: new Date(),
          }),
        },
      }),
    );

    const result = await service.resolveCase('admin-1', 'case-1', {
      action: 'DISMISS',
    });

    expect(result.status).toBe(CvModerationStatus.DISMISSED);
    expect(result.visibilityRestored).toBe(true);
  });

  it('rejects duplicate active moderation cases', async () => {
    prisma.cv.findFirst.mockResolvedValue({
      id: 'cv-1',
      userId: 'cand-1',
      visibility: CVVisibility.PUBLIC,
      user: {
        jobSeekerProfile: {
          displayName: 'Sara',
        },
      },
    });
    prisma.cvModerationCase.findFirst.mockResolvedValue({
      id: 'case-1',
      status: CvModerationStatus.AWAITING_CONSENT,
    });

    await expect(
      service.createCase('admin-1', {
        candidateId: 'cand-1',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
