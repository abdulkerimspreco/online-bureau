import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContactRequestStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MutedCompaniesService } from './muted-companies.service';

type MockedPrisma = {
  mutedCompany: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
  user: {
    findFirst: jest.Mock;
  };
  contactRequest: {
    updateMany: jest.Mock;
  };
  shortlistEntry: {
    deleteMany: jest.Mock;
  };
};

describe('MutedCompaniesService', () => {
  let service: MutedCompaniesService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      mutedCompany: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
      },
      contactRequest: {
        updateMany: jest.fn(),
      },
      shortlistEntry: {
        deleteMany: jest.fn(),
      },
    };

    service = new MutedCompaniesService(prisma as unknown as PrismaService);
  });

  it('lists muted companies for a candidate', async () => {
    prisma.mutedCompany.findMany.mockResolvedValue([
      {
        employerId: 'emp-1',
        createdAt: new Date('2026-05-24T10:00:00.000Z'),
        employer: {
          email: 'hello@company.test',
          employerProfile: {
            companyName: 'Company Test',
            website: 'https://company.test',
            industry: 'Software',
          },
        },
      },
    ]);

    const result = await service.listForCandidate('cand-1');

    expect(result).toEqual([
      {
        employerId: 'emp-1',
        companyName: 'Company Test',
        employerEmail: 'hello@company.test',
        website: 'https://company.test',
        industry: 'Software',
        mutedAt: new Date('2026-05-24T10:00:00.000Z'),
      },
    ]);
  });

  it('mutes a company and cleans up pending requests plus shortlist entries', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'emp-1',
      email: 'hello@company.test',
      employerProfile: {
        companyName: 'Company Test',
        website: 'https://company.test',
        industry: 'Software',
      },
    });
    prisma.mutedCompany.findUnique.mockResolvedValue(null);

    const result = await service.muteForCandidate('cand-1', 'emp-1');

    expect(prisma.mutedCompany.create).toHaveBeenCalledWith({
      data: {
        candidateId: 'cand-1',
        employerId: 'emp-1',
      },
    });
    expect(prisma.contactRequest.updateMany).toHaveBeenCalledWith({
      where: {
        candidateId: 'cand-1',
        employerId: 'emp-1',
        status: ContactRequestStatus.PENDING,
      },
      data: {
        status: ContactRequestStatus.DECLINED,
      },
    });
    expect(prisma.shortlistEntry.deleteMany).toHaveBeenCalledWith({
      where: {
        candidateId: 'cand-1',
        employerId: 'emp-1',
      },
    });
    expect(result.companyName).toBe('Company Test');
  });

  it('rejects muting your own account', async () => {
    await expect(service.muteForCandidate('user-1', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('unmutes an existing company entry', async () => {
    prisma.mutedCompany.findUnique.mockResolvedValue({
      candidateId: 'cand-1',
      employerId: 'emp-1',
    });

    const result = await service.unmuteForCandidate('cand-1', 'emp-1');

    expect(prisma.mutedCompany.delete).toHaveBeenCalledWith({
      where: {
        candidateId_employerId: {
          candidateId: 'cand-1',
          employerId: 'emp-1',
        },
      },
    });
    expect(result).toEqual({ success: true });
  });

  it('rejects unmuting an unknown company', async () => {
    prisma.mutedCompany.findUnique.mockResolvedValue(null);

    await expect(service.unmuteForCandidate('cand-1', 'emp-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
