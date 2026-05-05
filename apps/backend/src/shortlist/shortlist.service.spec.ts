import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CVVisibility, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShortlistService } from './shortlist.service';

type MockedPrisma = {
  cv: {
    findFirst: jest.Mock;
  };
  shortlistEntry: {
    findUnique: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    delete: jest.Mock;
  };
  contactRequest: {
    findFirst: jest.Mock;
  };
};

describe('ShortlistService', () => {
  let service: ShortlistService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      cv: {
        findFirst: jest.fn(),
      },
      shortlistEntry: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      contactRequest: {
        findFirst: jest.fn(),
      },
    };

    service = new ShortlistService(prisma as unknown as PrismaService);
  });

  it('blocks shortlisting your own account', async () => {
    await expect(
      service.addForEmployer(
        {
          id: 'emp-1',
          email: 'employer@example.com',
          role: UserRole.EMPLOYER,
          isVerified: true,
        },
        'emp-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('adds a visible candidate to shortlist', async () => {
    prisma.cv.findFirst.mockResolvedValue({
      id: 'cv-1',
      visibility: CVVisibility.PUBLIC,
    });
    prisma.shortlistEntry.findUnique.mockResolvedValue(null);
    prisma.shortlistEntry.create.mockResolvedValue({
      id: 'short-1',
      employerId: 'emp-1',
      candidateId: 'cand-1',
    });

    const result = await service.addForEmployer(
      {
        id: 'emp-1',
        email: 'employer@example.com',
        role: UserRole.EMPLOYER,
        isVerified: true,
      },
      'cand-1',
    );

    expect(result.id).toBe('short-1');
  });

  it('throws when removing a missing shortlist entry', async () => {
    prisma.shortlistEntry.findFirst.mockResolvedValue(null);

    await expect(
      service.removeForEmployer('emp-1', 'short-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
