import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CustomTagRequestStatus,
  NotificationType,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private mapAdminTag(tag: {
    id: string;
    name: string;
    createdAt?: Date;
    updatedAt?: Date;
    _count?: {
      cvs: number;
      savedSearches: number;
    };
  }) {
    return {
      id: tag.id,
      name: tag.name,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      cvCount: tag._count?.cvs ?? 0,
      savedSearchCount: tag._count?.savedSearches ?? 0,
    };
  }

  private mapCustomTagRequest(
    request: {
      id: string;
      requestedName: string;
      status: CustomTagRequestStatus;
      createdAt: Date;
      updatedAt: Date;
      reviewedAt: Date | null;
      tag: { id: string; name: string } | null;
      requester?: {
        id: string;
        email: string;
        jobSeekerProfile: { displayName: string } | null;
      };
      reviewedBy?: { email: string } | null;
    },
  ) {
    return {
      id: request.id,
      requestedName: request.requestedName,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      reviewedAt: request.reviewedAt,
      tag: request.tag
        ? {
            id: request.tag.id,
            name: request.tag.name,
          }
        : null,
      requester: request.requester
        ? {
            id: request.requester.id,
            email: request.requester.email,
            displayName: request.requester.jobSeekerProfile?.displayName ?? null,
          }
        : null,
      reviewedByEmail: request.reviewedBy?.email ?? null,
    };
  }

  private async findTagByNameInsensitive(name: string) {
    return this.prisma.tag.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
  }

  private async getImpactedUsers(tagId: string) {
    const [cvLinks, savedSearches] = await Promise.all([
      this.prisma.cVTag.findMany({
        where: { tagId },
        include: {
          cv: {
            select: {
              userId: true,
            },
          },
        },
      }),
      this.prisma.savedSearch.findMany({
        where: {
          OR: [
            { tagId },
            {
              tagIdsJson: {
                contains: tagId,
              },
            },
          ],
        },
        select: {
          employerId: true,
        },
      }),
    ]);

    return {
      candidateIds: [...new Set(cvLinks.map((link) => link.cv.userId))],
      employerIds: [...new Set(savedSearches.map((search) => search.employerId))],
    };
  }

  private async notifyTagRename(
    previousName: string,
    nextName: string,
    impactedUsers: { candidateIds: string[]; employerIds: string[] },
  ) {
    await Promise.all([
      ...impactedUsers.candidateIds.map((userId) =>
        this.notificationsService.create({
          userId,
          type: NotificationType.TAG_UPDATED,
          title: 'A CV tag was updated',
          message: `Your "${previousName}" CV tag is now called "${nextName}".`,
          linkUrl: '/job-seeker/tags',
        }),
      ),
      ...impactedUsers.employerIds.map((userId) =>
        this.notificationsService.create({
          userId,
          type: NotificationType.TAG_UPDATED,
          title: 'A saved-search tag was updated',
          message: `A saved-search tag you used was renamed from "${previousName}" to "${nextName}".`,
          linkUrl: '/employer/search',
        }),
      ),
    ]);
  }

  private async notifyTagRemoval(
    removedName: string,
    impactedUsers: { candidateIds: string[]; employerIds: string[] },
  ) {
    await Promise.all([
      ...impactedUsers.candidateIds.map((userId) =>
        this.notificationsService.create({
          userId,
          type: NotificationType.TAG_REMOVED,
          title: 'A CV tag was removed',
          message: `The "${removedName}" tag was retired and removed from your CV.`,
          linkUrl: '/job-seeker/tags',
        }),
      ),
      ...impactedUsers.employerIds.map((userId) =>
        this.notificationsService.create({
          userId,
          type: NotificationType.TAG_REMOVED,
          title: 'A saved-search tag was removed',
          message: `The "${removedName}" tag was retired and removed from your saved search filters.`,
          linkUrl: '/employer/search',
        }),
      ),
    ]);
  }

  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getAdminTags() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            cvs: true,
            savedSearches: true,
          },
        },
      },
    });

    return tags.map((tag) => this.mapAdminTag(tag));
  }

  async getMyTags(userId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { userId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    return cv.tags.map((ct) => ct.tag);
  }

  async getMyCustomTagRequests(userId: string) {
    const requests = await this.prisma.customTagRequest.findMany({
      where: {
        requesterId: userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewedBy: {
          select: {
            email: true,
          },
        },
      },
    });

    return requests.map((request) => this.mapCustomTagRequest(request));
  }

  async getAdminCustomTagRequests(status?: CustomTagRequestStatus) {
    const requests = await this.prisma.customTagRequest.findMany({
      where: status
        ? {
            status,
          }
        : undefined,
      orderBy: [
        { status: 'asc' },
        { createdAt: 'asc' },
      ],
      include: {
        tag: {
          select: {
            id: true,
            name: true,
          },
        },
        requester: {
          select: {
            id: true,
            email: true,
            jobSeekerProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            email: true,
          },
        },
      },
    });

    return requests.map((request) => this.mapCustomTagRequest(request));
  }

  async createCustomTagRequest(userId: string, name: string) {
    const normalizedName = this.normalizeName(name);

    if (!normalizedName) {
      throw new BadRequestException('Tag name is required.');
    }

    const cv = await this.prisma.cv.findUnique({
      where: { userId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    const existingTag = await this.findTagByNameInsensitive(normalizedName);

    if (existingTag) {
      throw new BadRequestException(
        'A matching tag already exists. Add it from the available tags list.',
      );
    }

    const existingRequest = await this.prisma.customTagRequest.findFirst({
      where: {
        requesterId: userId,
        status: CustomTagRequestStatus.PENDING,
        requestedName: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        'You already have a pending request for this tag.',
      );
    }

    const request = await this.prisma.customTagRequest.create({
      data: {
        requesterId: userId,
        requestedName: normalizedName,
      },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewedBy: {
          select: {
            email: true,
          },
        },
      },
    });

    return this.mapCustomTagRequest(request);
  }

  async attachTag(userId: string, tagId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { userId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    const count = await this.prisma.cVTag.count({
      where: { cvId: cv.id },
    });

    if (count >= 20) {
      throw new BadRequestException('Maximum 20 tags allowed');
    }

    try {
      await this.prisma.cVTag.create({
        data: {
          cvId: cv.id,
          tagId,
        },
      });
    } catch {
      throw new BadRequestException('Tag already attached');
    }

    return { message: 'Tag attached successfully' };
  }

  async removeTag(userId: string, tagId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { userId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    await this.prisma.cVTag.deleteMany({
      where: {
        cvId: cv.id,
        tagId,
      },
    });

    return { message: 'Tag removed successfully' };
  }

  async approveCustomTagRequest(adminId: string, requestId: string) {
    const request = await this.prisma.customTagRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Custom tag request not found.');
    }

    if (request.status !== CustomTagRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been reviewed.');
    }

    let tag = await this.findTagByNameInsensitive(request.requestedName);

    if (!tag) {
      tag = await this.prisma.tag.create({
        data: {
          name: request.requestedName,
        },
      });
    }

    const cv = await this.prisma.cv.findUnique({
      where: { userId: request.requesterId },
    });

    let attached = false;

    if (cv) {
      const [existingLink, count] = await Promise.all([
        this.prisma.cVTag.findUnique({
          where: {
            cvId_tagId: {
              cvId: cv.id,
              tagId: tag.id,
            },
          },
        }),
        this.prisma.cVTag.count({
          where: { cvId: cv.id },
        }),
      ]);

      if (!existingLink && count < 20) {
        await this.prisma.cVTag.create({
          data: {
            cvId: cv.id,
            tagId: tag.id,
          },
        });
        attached = true;
      }
    }

    const updatedRequest = await this.prisma.customTagRequest.update({
      where: { id: requestId },
      data: {
        status: CustomTagRequestStatus.APPROVED,
        reviewedById: adminId,
        reviewedAt: new Date(),
        tagId: tag.id,
      },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
          },
        },
        requester: {
          select: {
            id: true,
            email: true,
            jobSeekerProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            email: true,
          },
        },
      },
    });

    await this.notificationsService.create({
      userId: request.requesterId,
      type: NotificationType.TAG_REQUEST_APPROVED,
      title: 'Custom tag approved',
      message: attached
        ? `Your custom tag request for "${tag.name}" was approved and attached to your CV.`
        : `Your custom tag request for "${tag.name}" was approved.`,
      linkUrl: '/job-seeker/tags',
    });

    return this.mapCustomTagRequest(updatedRequest);
  }

  async rejectCustomTagRequest(
    adminId: string,
    requestId: string,
    note?: string,
  ) {
    const request = await this.prisma.customTagRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Custom tag request not found.');
    }

    if (request.status !== CustomTagRequestStatus.PENDING) {
      throw new BadRequestException('This request has already been reviewed.');
    }

    const updatedRequest = await this.prisma.customTagRequest.update({
      where: { id: requestId },
      data: {
        status: CustomTagRequestStatus.REJECTED,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      include: {
        tag: {
          select: {
            id: true,
            name: true,
          },
        },
        requester: {
          select: {
            id: true,
            email: true,
            jobSeekerProfile: {
              select: {
                displayName: true,
              },
            },
          },
        },
        reviewedBy: {
          select: {
            email: true,
          },
        },
      },
    });

    await this.notificationsService.create({
      userId: request.requesterId,
      type: NotificationType.TAG_REQUEST_REJECTED,
      title: 'Custom tag request declined',
      message: note?.trim()
        ? `Your custom tag request for "${request.requestedName}" was declined. ${note.trim()}`
        : `Your custom tag request for "${request.requestedName}" was declined.`,
      linkUrl: '/job-seeker/tags',
    });

    return this.mapCustomTagRequest(updatedRequest);
  }

  async createTag(name: string) {
    const trimmedName = this.normalizeName(name);

    if (!trimmedName) {
      throw new BadRequestException('Tag name is required.');
    }

    const existingTag = await this.findTagByNameInsensitive(trimmedName);

    if (existingTag) {
      throw new BadRequestException('Tag already exists.');
    }

    const tag = await this.prisma.tag.create({
      data: { name: trimmedName },
      include: {
        _count: {
          select: {
            cvs: true,
            savedSearches: true,
          },
        },
      },
    });

    return this.mapAdminTag(tag);
  }

  async renameTag(tagId: string, name: string) {
    const trimmedName = this.normalizeName(name);

    if (!trimmedName) {
      throw new BadRequestException('Tag name is required.');
    }

    const existingTag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!existingTag) {
      throw new NotFoundException('Tag not found.');
    }

    const conflictingTag = await this.prisma.tag.findFirst({
      where: {
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
        NOT: {
          id: tagId,
        },
      },
    });

    if (conflictingTag) {
      throw new BadRequestException('Tag already exists.');
    }

    const impactedUsers = await this.getImpactedUsers(tagId);

    const updatedTag = await this.prisma.tag.update({
      where: { id: tagId },
      data: { name: trimmedName },
      include: {
        _count: {
          select: {
            cvs: true,
            savedSearches: true,
          },
        },
      },
    });

    if (existingTag.name !== updatedTag.name) {
      await this.notifyTagRename(existingTag.name, updatedTag.name, impactedUsers);
    }

    return this.mapAdminTag(updatedTag);
  }

  async deleteTag(tagId: string) {
    const existingTag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!existingTag) {
      throw new NotFoundException('Tag not found.');
    }

    const impactedUsers = await this.getImpactedUsers(tagId);

    const affectedSavedSearches = await this.prisma.savedSearch.findMany({
      where: {
        OR: [
          { tagId },
          {
            tagIdsJson: {
              contains: tagId,
            },
          },
        ],
      },
      select: {
        id: true,
        tagId: true,
        tagIdsJson: true,
        tagMode: true,
      },
    });

    for (const search of affectedSavedSearches) {
      let parsedTagIds: string[] = [];

      if (search.tagIdsJson) {
        try {
          const parsed = JSON.parse(search.tagIdsJson) as string[];
          parsedTagIds = Array.isArray(parsed) ? parsed : [];
        } catch {
          parsedTagIds = [];
        }
      } else if (search.tagId) {
        parsedTagIds = [search.tagId];
      }

      const nextTagIds = parsedTagIds.filter((id) => id !== tagId);
      const nextTagId = nextTagIds.length === 1 ? nextTagIds[0] : null;

      await this.prisma.savedSearch.update({
        where: { id: search.id },
        data: {
          tagId: search.tagId === tagId ? nextTagId : search.tagId,
          tagIdsJson: nextTagIds.length > 0 ? JSON.stringify(nextTagIds) : null,
          tagMode: nextTagIds.length > 1 ? search.tagMode : null,
        },
      });
    }

    await this.prisma.tag.delete({
      where: { id: tagId },
    });

    await this.notifyTagRemoval(existingTag.name, impactedUsers);

    return { success: true };
  }
}
