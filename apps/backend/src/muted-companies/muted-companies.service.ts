import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContactRequestStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MutedCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async listForCandidate(candidateId: string) {
    const mutedCompanies = await this.prisma.mutedCompany.findMany({
      where: {
        candidateId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        employer: {
          select: {
            id: true,
            email: true,
            employerProfile: true,
          },
        },
      },
    });

    return mutedCompanies.map((item) => ({
      employerId: item.employerId,
      companyName:
        item.employer.employerProfile?.companyName ?? 'Unknown company',
      employerEmail: item.employer.email,
      website: item.employer.employerProfile?.website ?? null,
      industry: item.employer.employerProfile?.industry ?? null,
      mutedAt: item.createdAt,
    }));
  }

  async muteForCandidate(candidateId: string, employerId: string) {
    if (candidateId === employerId) {
      throw new BadRequestException('You cannot mute your own account.');
    }

    const employer = await this.prisma.user.findFirst({
      where: {
        id: employerId,
        role: UserRole.EMPLOYER,
        employerProfile: {
          isNot: null,
        },
      },
      select: {
        id: true,
        email: true,
        employerProfile: true,
      },
    });

    if (!employer) {
      throw new NotFoundException('Company not found.');
    }

    const existingMute = await this.prisma.mutedCompany.findUnique({
      where: {
        candidateId_employerId: {
          candidateId,
          employerId,
        },
      },
    });

    const createdMute = !existingMute
      ? await this.prisma.mutedCompany.create({
        data: {
          candidateId,
          employerId,
        },
      })
      : null;

    await Promise.all([
      this.prisma.contactRequest.updateMany({
        where: {
          candidateId,
          employerId,
          status: ContactRequestStatus.PENDING,
        },
        data: {
          status: ContactRequestStatus.DECLINED,
        },
      }),
      this.prisma.shortlistEntry.deleteMany({
        where: {
          candidateId,
          employerId,
        },
      }),
    ]);

    return {
      employerId,
      companyName: employer.employerProfile?.companyName ?? 'Unknown company',
      employerEmail: employer.email,
      website: employer.employerProfile?.website ?? null,
      industry: employer.employerProfile?.industry ?? null,
      mutedAt: existingMute?.createdAt ?? createdMute?.createdAt ?? new Date(),
    };
  }

  async unmuteForCandidate(candidateId: string, employerId: string) {
    const existingMute = await this.prisma.mutedCompany.findUnique({
      where: {
        candidateId_employerId: {
          candidateId,
          employerId,
        },
      },
    });

    if (!existingMute) {
      throw new NotFoundException('Muted company not found.');
    }

    await this.prisma.mutedCompany.delete({
      where: {
        candidateId_employerId: {
          candidateId,
          employerId,
        },
      },
    });

    return { success: true };
  }
}
