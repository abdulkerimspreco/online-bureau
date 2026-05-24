import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

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

  async attachTag(userId: string, tagId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { userId },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    // limit: max 20 tags
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

  async createTag(name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new BadRequestException('Tag name is required.');
    }

    try {
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
    } catch {
      throw new BadRequestException('Tag already exists.');
    }
  }

  async renameTag(tagId: string, name: string) {
    const trimmedName = name.trim();

    if (!trimmedName) {
      throw new BadRequestException('Tag name is required.');
    }

    const existingTag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!existingTag) {
      throw new NotFoundException('Tag not found.');
    }

    try {
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

      return this.mapAdminTag(updatedTag);
    } catch {
      throw new BadRequestException('Tag already exists.');
    }
  }

  async deleteTag(tagId: string) {
    const existingTag = await this.prisma.tag.findUnique({
      where: { id: tagId },
    });

    if (!existingTag) {
      throw new NotFoundException('Tag not found.');
    }

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

    return { success: true };
  }
}
