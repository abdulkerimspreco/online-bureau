import { NotFoundException } from '@nestjs/common';
import { JobSeekersService } from './job-seekers.service';
import { PrismaService } from '../prisma/prisma.service';

type MockedPrisma = {
  jobSeekerProfile: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

describe('JobSeekersService', () => {
  let service: JobSeekersService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      jobSeekerProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new JobSeekersService(prisma as unknown as PrismaService);
  });

  it('throws when the profile does not exist', async () => {
    prisma.jobSeekerProfile.findUnique.mockResolvedValue(null);

    await expect(service.getMyProfile('user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws when updating a missing profile', async () => {
    prisma.jobSeekerProfile.findUnique.mockResolvedValue(null);

    await expect(
      service.updateMyProfile('user-1', {
        displayName: 'Abdul',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('updates the profile when it exists', async () => {
    prisma.jobSeekerProfile.findUnique.mockResolvedValue({
      userId: 'user-1',
    });
    prisma.jobSeekerProfile.update.mockResolvedValue({
      userId: 'user-1',
      displayName: 'Abdul',
      location: 'Sarajevo',
      preferredJobCategories: 'Backend',
    });

    const result = await service.updateMyProfile('user-1', {
      displayName: 'Abdul',
      location: 'Sarajevo',
      preferredJobCategories: 'Backend',
    });

    expect(prisma.jobSeekerProfile.update).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: {
        displayName: 'Abdul',
        location: 'Sarajevo',
        preferredJobCategories: 'Backend',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isVerified: true,
            createdAt: true,
          },
        },
      },
    });
    expect(result.displayName).toBe('Abdul');
  });
});
