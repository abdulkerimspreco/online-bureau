import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CVVisibility, ContactRequestStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Injectable()
export class ShortlistService {
  constructor(private readonly prisma: PrismaService) {}

  async addForEmployer(user: AuthUser, candidateId: string) {
    if (candidateId === user.id) {
      throw new BadRequestException(
        'You cannot shortlist your own account.',
      );
    }

    const candidateCv = await this.prisma.cv.findFirst({
      where: {
        userId: candidateId,
        visibility: {
          in: [CVVisibility.PUBLIC, CVVisibility.COMPANY_ONLY],
        },
        user: {
          role: UserRole.JOB_SEEKER,
          jobSeekerProfile: {
            isNot: null,
          },
        },
      },
    });

    if (!candidateCv) {
      throw new NotFoundException('Candidate is not available for shortlist.');
    }

    const existingEntry = await this.prisma.shortlistEntry.findUnique({
      where: {
        employerId_candidateId: {
          employerId: user.id,
          candidateId,
        },
      },
    });

    if (existingEntry) {
      throw new BadRequestException('Candidate is already on your shortlist.');
    }

    return this.prisma.shortlistEntry.create({
      data: {
        employerId: user.id,
        candidateId,
      },
    });
  }

  async listForEmployer(employerId: string) {
    const entries = await this.prisma.shortlistEntry.findMany({
      where: {
        employerId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        candidate: {
          select: {
            id: true,
            email: true,
            jobSeekerProfile: true,
            cv: {
              include: {
                tags: {
                  include: {
                    tag: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return Promise.all(
      entries
        .filter(
          (entry) => entry.candidate.jobSeekerProfile && entry.candidate.cv,
        )
        .map(async (entry) => {
          const latestContactRequest =
            await this.prisma.contactRequest.findFirst({
              where: {
                employerId,
                candidateId: entry.candidateId,
              },
              orderBy: {
                updatedAt: 'desc',
              },
            });

          const cv = entry.candidate.cv!;
          const profile = entry.candidate.jobSeekerProfile!;

          return {
            id: entry.id,
            candidateId: entry.candidateId,
            displayName: profile.displayName,
            location: profile.location,
            preferredJobCategories: profile.preferredJobCategories,
            cvUpdatedAt: cv.updatedAt,
            visibility: cv.visibility,
            tags: cv.tags.map((tagEntry) => ({
              id: tagEntry.tag.id,
              name: tagEntry.tag.name,
            })),
            addedAt: entry.createdAt,
            contactRequestStatus: latestContactRequest?.status ?? null,
            contactEmail:
              latestContactRequest?.status === ContactRequestStatus.ACCEPTED
                ? entry.candidate.email
                : null,
          };
        }),
    );
  }

  async removeForEmployer(employerId: string, shortlistEntryId: string) {
    const existingEntry = await this.prisma.shortlistEntry.findFirst({
      where: {
        id: shortlistEntryId,
        employerId,
      },
    });

    if (!existingEntry) {
      throw new NotFoundException('Shortlist entry not found.');
    }

    await this.prisma.shortlistEntry.delete({
      where: {
        id: shortlistEntryId,
      },
    });

    return { success: true };
  }
}
