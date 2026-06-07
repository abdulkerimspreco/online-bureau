import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveStoredCvPath(fileUrl: string | null | undefined) {
    if (!fileUrl) return null;

    if (fileUrl.startsWith('/uploads/')) {
      return join(process.cwd(), fileUrl.slice(1));
    }

    if (fileUrl.startsWith('/')) {
      return fileUrl;
    }

    return join(process.cwd(), fileUrl);
  }

  async listUsers(dto: ListAdminUsersDto) {
    const query = dto.query?.trim();
    const filters: Prisma.UserWhereInput[] = [];

    if (dto.role) {
      filters.push({ role: dto.role });
    }

    if (dto.status === 'ACTIVE') {
      filters.push({ isActive: true });
    }

    if (dto.status === 'INACTIVE') {
      filters.push({ isActive: false });
    }

    if (query) {
      filters.push({
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
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
            employerProfile: {
              is: {
                companyName: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      });
    }

    const users = await this.prisma.user.findMany({
      where: filters.length > 0 ? { AND: filters } : undefined,
      orderBy: [{ createdAt: 'desc' }],
      include: {
        jobSeekerProfile: true,
        employerProfile: true,
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isActive: user.isActive,
      deactivatedAt: user.deactivatedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      displayName: user.jobSeekerProfile?.displayName ?? null,
      companyName: user.employerProfile?.companyName ?? null,
    }));
  }

  async deactivateUser(adminId: string, userId: string) {
    if (adminId === userId) {
      throw new BadRequestException('You cannot deactivate your own account.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.isActive) {
      return {
        id: user.id,
        isActive: user.isActive,
        deactivatedAt: user.deactivatedAt,
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deactivatedAt: new Date(),
        authTokenVersion: {
          increment: 1,
        },
      },
    });

    await this.prisma.adminActionLog.create({
      data: {
        adminId,
        targetUserId: userId,
        action: 'DEACTIVATE_USER',
      },
    });

    return {
      id: updatedUser.id,
      isActive: updatedUser.isActive,
      deactivatedAt: updatedUser.deactivatedAt,
    };
  }

  async reactivateUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isActive) {
      return {
        id: user.id,
        isActive: user.isActive,
        deactivatedAt: user.deactivatedAt,
      };
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        deactivatedAt: null,
        authTokenVersion: {
          increment: 1,
        },
      },
    });

    await this.prisma.adminActionLog.create({
      data: {
        adminId,
        targetUserId: userId,
        action: 'REACTIVATE_USER',
      },
    });

    return {
      id: updatedUser.id,
      isActive: updatedUser.isActive,
      deactivatedAt: updatedUser.deactivatedAt,
    };
  }

  async deleteUser(adminId: string, userId: string) {
    if (adminId === userId) {
      throw new BadRequestException('You cannot permanently delete your own admin account.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        cv: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const storedCvPath = this.resolveStoredCvPath(user.cv?.fileUrl);

    if (storedCvPath) {
      try {
        await unlink(storedCvPath);
      } catch {
        // stored file may already be missing
      }
    }

    await this.prisma.adminActionLog.create({
      data: {
        adminId,
        targetUserId: userId,
        action: 'DELETE_USER',
      },
    });

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  }
}
