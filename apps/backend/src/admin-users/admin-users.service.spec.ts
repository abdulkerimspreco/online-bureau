import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUsersService } from './admin-users.service';

type MockedPrisma = {
  user: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  adminActionLog: {
    create: jest.Mock;
  };
};

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      user: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      adminActionLog: {
        create: jest.fn(),
      },
    } as unknown as MockedPrisma;

    service = new AdminUsersService(prisma as unknown as PrismaService);
  });

  it('lists users with role and status filters', async () => {
    prisma.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        email: 'person@example.com',
        role: UserRole.JOB_SEEKER,
        isVerified: true,
        isActive: true,
        deactivatedAt: null,
        createdAt: new Date('2026-05-24T08:00:00.000Z'),
        updatedAt: new Date('2026-05-24T08:00:00.000Z'),
        jobSeekerProfile: { displayName: 'Person' },
        employerProfile: null,
      },
    ]);

    const result = await service.listUsers({
      query: 'person',
      role: 'JOB_SEEKER',
      status: 'ACTIVE',
    });

    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(result[0]).toMatchObject({
      id: 'user-1',
      displayName: 'Person',
      isActive: true,
    });
  });

  it('deactivates a user and records the admin action', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: true,
    });
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      isActive: false,
      deactivatedAt: new Date('2026-05-24T10:00:00.000Z'),
    });

    const result = await service.deactivateUser('admin-1', 'user-1');

    expect(prisma.user.update).toHaveBeenCalled();
    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-1',
        targetUserId: 'user-1',
        action: 'DEACTIVATE_USER',
      },
    });
    expect(result.isActive).toBe(false);
  });

  it('reactivates an inactive user and records the admin action', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      isActive: false,
      deactivatedAt: new Date('2026-05-24T10:00:00.000Z'),
    });
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      isActive: true,
      deactivatedAt: null,
    });

    const result = await service.reactivateUser('admin-1', 'user-1');

    expect(prisma.adminActionLog.create).toHaveBeenCalledWith({
      data: {
        adminId: 'admin-1',
        targetUserId: 'user-1',
        action: 'REACTIVATE_USER',
      },
    });
    expect(result.isActive).toBe(true);
  });

  it('rejects self-deactivation', async () => {
    await expect(service.deactivateUser('user-1', 'user-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects deleting a missing user', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.deleteUser('admin-1', 'missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
