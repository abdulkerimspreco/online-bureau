import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async getAllTags() {
    return this.prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
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
    return this.prisma.tag.create({
      data: { name },
    });
  }
}