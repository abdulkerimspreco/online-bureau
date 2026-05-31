import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdminAnalyticsService } from './admin-analytics.service';

type MockedPrisma = {
  user: {
    count: jest.Mock;
    findMany: jest.Mock;
  };
  cv: {
    count: jest.Mock;
    findMany: jest.Mock;
  };
  contactRequest: {
    findMany: jest.Mock;
  };
};

describe('AdminAnalyticsService', () => {
  let service: AdminAnalyticsService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      cv: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      contactRequest: {
        findMany: jest.fn(),
      },
    };

    service = new AdminAnalyticsService(prisma as unknown as PrismaService);
  });

  it('returns aggregated anonymised analytics', async () => {
    prisma.user.count.mockResolvedValue(12);
    prisma.cv.count.mockResolvedValue(8);
    prisma.user.findMany.mockResolvedValue([
      { createdAt: new Date('2026-05-20T10:00:00.000Z') },
      { createdAt: new Date('2026-05-20T12:00:00.000Z') },
      { createdAt: new Date('2026-05-21T08:00:00.000Z') },
    ]);
    prisma.contactRequest.findMany.mockResolvedValue([
      { createdAt: new Date('2026-05-20T14:00:00.000Z') },
      { createdAt: new Date('2026-05-21T15:00:00.000Z') },
    ]);
    prisma.cv.findMany.mockResolvedValue([
      { createdAt: new Date('2026-05-20T09:30:00.000Z') },
    ]);

    const result = await service.getAnalytics({
      preset: 'custom',
      startDate: '2026-05-20',
      endDate: '2026-05-21',
    });

    expect(result.summary).toEqual({
      totalUsers: 12,
      activeCvCount: 8,
      contactRequestsSent: 2,
      registrationsInRange: 3,
      cvsInRange: 1,
    });
    expect(result.series).toEqual([
      {
        date: '2026-05-20',
        registrations: 2,
        contactRequests: 1,
        activeCvs: 1,
      },
      {
        date: '2026-05-21',
        registrations: 1,
        contactRequests: 1,
        activeCvs: 0,
      },
    ]);
  });

  it('rejects invalid custom ranges', async () => {
    await expect(
      service.getAnalytics({
        preset: 'custom',
        startDate: '2026-05-22',
        endDate: '2026-05-20',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
