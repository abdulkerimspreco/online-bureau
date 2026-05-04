import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CVVisibility, UserRole } from '@prisma/client';
import { EmployersService } from './employers.service';
import { PrismaService } from '../prisma/prisma.service';

type MockedPrisma = {
  employerProfile: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  cv: {
    findFirst: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
  };
  contactRequest: {
    findFirst: jest.Mock;
  };
};

describe('EmployersService', () => {
  let service: EmployersService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      employerProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      cv: {
        findFirst: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
      contactRequest: {
        findFirst: jest.fn(),
      },
    };

    service = new EmployersService(prisma as unknown as PrismaService);
  });

  it('throws when the employer profile does not exist', async () => {
    prisma.employerProfile.findUnique.mockResolvedValue(null);

    await expect(service.getMyProfile('user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when updating a missing employer profile', async () => {
    prisma.employerProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.updateMyProfile('user-1', {
        companyName: 'Online Bureau',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('blocks unverified employers from searching candidates', async () => {
    await expect(
      service.searchCandidates(
        {
          id: 'user-1',
          email: 'employer@example.com',
          role: UserRole.EMPLOYER,
          isVerified: false,
        },
        {},
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('maps visible candidate search results', async () => {
    prisma.cv.count.mockResolvedValue(1);
    prisma.cv.findMany.mockResolvedValue([
      {
        id: 'cv-1',
        visibility: CVVisibility.PUBLIC,
        createdAt: new Date('2026-05-03T09:00:00.000Z'),
        updatedAt: new Date('2026-05-03T10:00:00.000Z'),
        user: {
          id: 'job-seeker-1',
          jobSeekerProfile: {
            displayName: 'Abdul',
            location: 'Sarajevo',
            preferredJobCategories: 'Backend, Fullstack',
          },
        },
        tags: [
          {
            tag: {
              id: 'tag-1',
              name: 'NestJS',
            },
          },
        ],
      },
    ]);

    const result = await service.searchCandidates(
      {
        id: 'user-1',
        email: 'employer@example.com',
        role: UserRole.EMPLOYER,
        isVerified: true,
      },
      { query: 'backend', page: 1 },
    );

    expect(prisma.cv.count).toHaveBeenCalled();
    expect(prisma.cv.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 20,
      }),
    );
    expect(result).toEqual({
      items: [
        {
          cvId: 'cv-1',
          candidateId: 'job-seeker-1',
          displayName: 'Abdul',
          location: 'Sarajevo',
          preferredJobCategories: 'Backend, Fullstack',
          visibility: CVVisibility.PUBLIC,
          createdAt: new Date('2026-05-03T09:00:00.000Z'),
          updatedAt: new Date('2026-05-03T10:00:00.000Z'),
          tags: [{ id: 'tag-1', name: 'NestJS' }],
        },
      ],
      total: 1,
      page: 1,
      perPage: 20,
    });
  });

  it('returns a candidate profile for verified employers', async () => {
    prisma.cv.findFirst.mockResolvedValue({
      id: 'cv-1',
      visibility: CVVisibility.PUBLIC,
      createdAt: new Date('2026-05-03T09:00:00.000Z'),
      updatedAt: new Date('2026-05-03T10:00:00.000Z'),
        user: {
          id: 'job-seeker-1',
          email: 'candidate@example.com',
          jobSeekerProfile: {
            displayName: 'Abdul',
            location: 'Sarajevo',
          preferredJobCategories: 'Backend, Fullstack',
        },
      },
      tags: [
        {
          tag: {
            id: 'tag-1',
            name: 'NestJS',
          },
        },
      ],
    });
    prisma.contactRequest.findFirst.mockResolvedValue({
      id: 'req-1',
      status: 'ACCEPTED',
      message: 'Hello there',
      createdAt: new Date('2026-05-03T11:00:00.000Z'),
      updatedAt: new Date('2026-05-03T12:00:00.000Z'),
    });

    const result = await service.getCandidateProfile(
      {
        id: 'user-1',
        email: 'employer@example.com',
        role: UserRole.EMPLOYER,
        isVerified: true,
      },
      'job-seeker-1',
    );

    expect(result.candidateId).toBe('job-seeker-1');
    expect(result.tags).toEqual([{ id: 'tag-1', name: 'NestJS' }]);
    expect(result.contactRequest?.contactEmail).toBe('candidate@example.com');
  });
});
