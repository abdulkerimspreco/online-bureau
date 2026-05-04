import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ContactRequestStatus,
  CVVisibility,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ContactRequestsService } from './contact-requests.service';

type MockedPrisma = {
  cv: {
    findFirst: jest.Mock;
  };
  contactRequest: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
  };
};

describe('ContactRequestsService', () => {
  let service: ContactRequestsService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      cv: {
        findFirst: jest.fn(),
      },
      contactRequest: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new ContactRequestsService(prisma as unknown as PrismaService);
  });

  it('blocks unverified employers from sending requests', async () => {
    await expect(
      service.createForEmployer(
        {
          id: 'emp-1',
          email: 'employer@example.com',
          role: UserRole.EMPLOYER,
          isVerified: false,
        },
        { candidateId: 'cand-1' },
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects requests to unavailable candidates', async () => {
    prisma.cv.findFirst.mockResolvedValue(null);

    await expect(
      service.createForEmployer(
        {
          id: 'emp-1',
          email: 'employer@example.com',
          role: UserRole.EMPLOYER,
          isVerified: true,
        },
        { candidateId: 'cand-1', message: 'Hello there' },
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects duplicate pending requests', async () => {
    prisma.cv.findFirst.mockResolvedValue({
      user: {
        email: 'candidate@example.com',
        jobSeekerProfile: { displayName: 'Abdul' },
      },
    });
    prisma.contactRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      status: ContactRequestStatus.PENDING,
    });

    await expect(
      service.createForEmployer(
        {
          id: 'emp-1',
          email: 'employer@example.com',
          role: UserRole.EMPLOYER,
          isVerified: true,
        },
        { candidateId: 'cand-1', message: 'Hello there' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a pending request for a visible candidate', async () => {
    prisma.cv.findFirst.mockResolvedValue({
      id: 'cv-1',
      visibility: CVVisibility.PUBLIC,
      user: {
        email: 'candidate@example.com',
        jobSeekerProfile: { displayName: 'Abdul' },
      },
    });
    prisma.contactRequest.findFirst.mockResolvedValue(null);
    prisma.contactRequest.create.mockResolvedValue({
      id: 'req-1',
      status: ContactRequestStatus.PENDING,
      createdAt: new Date('2026-05-03T18:00:00.000Z'),
      message: 'Hello there',
      employer: { employerProfile: { companyName: 'Online Bureau' } },
      candidate: {
        id: 'cand-1',
        jobSeekerProfile: { displayName: 'Abdul' },
      },
    });

    const result = await service.createForEmployer(
      {
        id: 'emp-1',
        email: 'employer@example.com',
        role: UserRole.EMPLOYER,
        isVerified: true,
      },
      { candidateId: 'cand-1', message: 'Hello there' },
    );

    expect(prisma.contactRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          employerId: 'emp-1',
          candidateId: 'cand-1',
          message: 'Hello there',
        },
      }),
    );
    expect(result.status).toBe(ContactRequestStatus.PENDING);
  });

  it('returns pending requests for a candidate', async () => {
    prisma.contactRequest.findMany.mockResolvedValue([
      {
        id: 'req-1',
        employerId: 'emp-1',
        message: 'Hello there',
        createdAt: new Date('2026-05-03T18:00:00.000Z'),
        status: ContactRequestStatus.PENDING,
        employer: {
          employerProfile: {
            companyName: 'Online Bureau',
          },
        },
      },
    ]);

    const result = await service.getPendingForCandidate('cand-1');

    expect(result).toEqual([
      {
        id: 'req-1',
        employerId: 'emp-1',
        companyName: 'Online Bureau',
        message: 'Hello there',
        createdAt: new Date('2026-05-03T18:00:00.000Z'),
        status: ContactRequestStatus.PENDING,
      },
    ]);
  });
});
