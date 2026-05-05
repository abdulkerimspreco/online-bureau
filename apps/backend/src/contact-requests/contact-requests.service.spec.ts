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
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ContactRequestsService } from './contact-requests.service';
import { ContactRequestDecision } from './dto/respond-contact-request.dto';

type MockedPrisma = {
  cv: {
    findFirst: jest.Mock;
  };
  contactRequest: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
};

type MockedNotificationsService = {
  create: jest.Mock;
};

describe('ContactRequestsService', () => {
  let service: ContactRequestsService;
  let prisma: MockedPrisma;
  let notificationsService: MockedNotificationsService;

  beforeEach(() => {
    prisma = {
      cv: {
        findFirst: jest.fn(),
      },
      contactRequest: {
        findFirst: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    notificationsService = {
      create: jest.fn(),
    };

    service = new ContactRequestsService(
      prisma as unknown as PrismaService,
      notificationsService as unknown as NotificationsService,
    );
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

  it('blocks retries during the 30-day decline cooldown', async () => {
    prisma.cv.findFirst.mockResolvedValue({
      user: {
        email: 'candidate@example.com',
        jobSeekerProfile: { displayName: 'Abdul' },
      },
    });
    prisma.contactRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      status: ContactRequestStatus.DECLINED,
      updatedAt: new Date('2026-05-01T18:00:00.000Z'),
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
    expect(notificationsService.create).toHaveBeenCalled();
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

  it('returns candidate contact request history with employer details', async () => {
    prisma.contactRequest.findMany.mockResolvedValue([
      {
        id: 'req-1',
        employerId: 'emp-1',
        message: 'Hello there',
        createdAt: new Date('2026-05-03T18:00:00.000Z'),
        updatedAt: new Date('2026-05-04T08:00:00.000Z'),
        status: ContactRequestStatus.ACCEPTED,
        employer: {
          id: 'emp-1',
          email: 'employer@example.com',
          employerProfile: {
            companyName: 'Online Bureau',
          },
        },
      },
    ]);

    const result = await service.getHistoryForCandidate('cand-1');

    expect(result).toEqual([
      {
        id: 'req-1',
        employerId: 'emp-1',
        companyName: 'Online Bureau',
        employerEmail: 'employer@example.com',
        message: 'Hello there',
        createdAt: new Date('2026-05-03T18:00:00.000Z'),
        updatedAt: new Date('2026-05-04T08:00:00.000Z'),
        status: ContactRequestStatus.ACCEPTED,
      },
    ]);
  });

  it('accepts a pending contact request and reveals the candidate email', async () => {
    prisma.contactRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      status: ContactRequestStatus.PENDING,
      employer: {
        email: 'employer@example.com',
        employerProfile: { companyName: 'Online Bureau' },
      },
      candidate: {
        jobSeekerProfile: { displayName: 'Abdul' },
      },
    });
    prisma.contactRequest.update.mockResolvedValue({
      id: 'req-1',
      employerId: 'emp-1',
      status: ContactRequestStatus.ACCEPTED,
      updatedAt: new Date('2026-05-04T10:00:00.000Z'),
      employer: {
        email: 'employer@example.com',
        employerProfile: { companyName: 'Online Bureau' },
      },
      candidate: {
        id: 'cand-1',
        email: 'candidate@example.com',
        jobSeekerProfile: { displayName: 'Abdul' },
      },
    });

    const result = await service.respondToCandidateRequest('cand-1', 'req-1', {
      action: ContactRequestDecision.ACCEPT,
    });

    expect(prisma.contactRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1' },
        data: { status: ContactRequestStatus.ACCEPTED },
      }),
    );
    expect(result.candidate.email).toBe('candidate@example.com');
    expect(notificationsService.create).toHaveBeenCalled();
  });

  it('rejects responding to an already processed request', async () => {
    prisma.contactRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      status: ContactRequestStatus.DECLINED,
      employer: {
        email: 'employer@example.com',
        employerProfile: { companyName: 'Online Bureau' },
      },
      candidate: {
        jobSeekerProfile: { displayName: 'Abdul' },
      },
    });

    await expect(
      service.respondToCandidateRequest('cand-1', 'req-1', {
        action: ContactRequestDecision.DECLINE,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns employer contact request history with unlocked email only for accepted requests', async () => {
    prisma.contactRequest.findMany.mockResolvedValue([
      {
        id: 'req-1',
        employerId: 'emp-1',
        candidateId: 'cand-1',
        message: 'Hello there',
        createdAt: new Date('2026-05-03T18:00:00.000Z'),
        updatedAt: new Date('2026-05-04T08:00:00.000Z'),
        status: ContactRequestStatus.ACCEPTED,
        candidate: {
          id: 'cand-1',
          email: 'candidate@example.com',
          jobSeekerProfile: {
            displayName: 'Abdul',
            location: 'Sarajevo',
          },
        },
      },
      {
        id: 'req-2',
        employerId: 'emp-1',
        candidateId: 'cand-2',
        message: null,
        createdAt: new Date('2026-05-02T18:00:00.000Z'),
        updatedAt: new Date('2026-05-03T08:00:00.000Z'),
        status: ContactRequestStatus.DECLINED,
        candidate: {
          id: 'cand-2',
          email: 'hidden@example.com',
          jobSeekerProfile: {
            displayName: 'Lejla',
            location: 'Mostar',
          },
        },
      },
    ]);

    const result = await service.getHistoryForEmployer('emp-1');

    expect(result[0].candidateEmail).toBe('candidate@example.com');
    expect(result[1].candidateEmail).toBeNull();
    expect(result[1].canRequestAgainAt).toBeInstanceOf(Date);
  });
});
