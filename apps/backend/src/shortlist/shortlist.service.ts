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
        folderLinks: {
          include: {
            folder: true,
          },
        },
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
            folders: entry.folderLinks.map((folderLink) => ({
              id: folderLink.folder.id,
              name: folderLink.folder.name,
            })),
          };
        }),
    );
  }

  async listFoldersForEmployer(employerId: string) {
    const folders = await this.prisma.shortlistFolder.findMany({
      where: {
        employerId,
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        entries: true,
      },
    });

    return folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      entryCount: folder.entries.length,
      shortlistEntryIds: folder.entries.map((entry) => entry.shortlistEntryId),
    }));
  }

  async createFolderForEmployer(employerId: string, name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new BadRequestException('Folder name is required.');
    }

    const folder = await this.prisma.shortlistFolder.create({
      data: {
        employerId,
        name: trimmedName,
      },
    });

    return {
      id: folder.id,
      name: folder.name,
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
      entryCount: 0,
      shortlistEntryIds: [],
    };
  }

  async deleteFolderForEmployer(employerId: string, folderId: string) {
    const folder = await this.prisma.shortlistFolder.findFirst({
      where: {
        id: folderId,
        employerId,
      },
    });

    if (!folder) {
      throw new NotFoundException('Shortlist folder not found.');
    }

    await this.prisma.shortlistFolder.delete({
      where: {
        id: folderId,
      },
    });

    return { success: true };
  }

  async addEntryToFolderForEmployer(
    employerId: string,
    folderId: string,
    shortlistEntryId: string,
  ) {
    const [folder, shortlistEntry] = await Promise.all([
      this.prisma.shortlistFolder.findFirst({
        where: {
          id: folderId,
          employerId,
        },
      }),
      this.prisma.shortlistEntry.findFirst({
        where: {
          id: shortlistEntryId,
          employerId,
        },
      }),
    ]);

    if (!folder) {
      throw new NotFoundException('Shortlist folder not found.');
    }

    if (!shortlistEntry) {
      throw new NotFoundException('Shortlist entry not found.');
    }

    const existingLink = await this.prisma.shortlistFolderEntry.findUnique({
      where: {
        folderId_shortlistEntryId: {
          folderId,
          shortlistEntryId,
        },
      },
    });

    if (existingLink) {
      throw new BadRequestException('Candidate is already in this folder.');
    }

    await this.prisma.shortlistFolderEntry.create({
      data: {
        folderId,
        shortlistEntryId,
      },
    });

    return { success: true };
  }

  async removeEntryFromFolderForEmployer(
    employerId: string,
    folderId: string,
    shortlistEntryId: string,
  ) {
    const [folder, shortlistEntry] = await Promise.all([
      this.prisma.shortlistFolder.findFirst({
        where: {
          id: folderId,
          employerId,
        },
      }),
      this.prisma.shortlistEntry.findFirst({
        where: {
          id: shortlistEntryId,
          employerId,
        },
      }),
    ]);

    if (!folder) {
      throw new NotFoundException('Shortlist folder not found.');
    }

    if (!shortlistEntry) {
      throw new NotFoundException('Shortlist entry not found.');
    }

    const existingLink = await this.prisma.shortlistFolderEntry.findUnique({
      where: {
        folderId_shortlistEntryId: {
          folderId,
          shortlistEntryId,
        },
      },
    });

    if (!existingLink) {
      throw new NotFoundException('Folder entry not found.');
    }

    await this.prisma.shortlistFolderEntry.delete({
      where: {
        folderId_shortlistEntryId: {
          folderId,
          shortlistEntryId,
        },
      },
    });

    return { success: true };
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
