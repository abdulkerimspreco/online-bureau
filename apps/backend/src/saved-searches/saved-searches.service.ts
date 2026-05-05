import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Injectable()
export class SavedSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  async createForEmployer(user: AuthUser, dto: CreateSavedSearchDto) {
    const name = dto.name.trim();
    const query = dto.query?.trim() || null;
    const location = dto.location?.trim() || null;
    const tagId = dto.tagId || null;

    if (!query && !location && !tagId) {
      throw new BadRequestException(
        'Add at least one filter before saving a search.',
      );
    }

    if (tagId) {
      const existingTag = await this.prisma.tag.findUnique({
        where: { id: tagId },
      });

      if (!existingTag) {
        throw new NotFoundException('Selected tag was not found.');
      }
    }

    const savedSearch = await this.prisma.savedSearch.create({
      data: {
        employerId: user.id,
        name,
        query,
        location,
        tagId,
      },
      include: {
        tag: true,
      },
    });

    return this.mapSavedSearch(savedSearch);
  }

  async listForEmployer(employerId: string) {
    const searches = await this.prisma.savedSearch.findMany({
      where: { employerId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        tag: true,
      },
    });

    return searches.map((search) => this.mapSavedSearch(search));
  }

  async deleteForEmployer(employerId: string, savedSearchId: string) {
    const existing = await this.prisma.savedSearch.findFirst({
      where: {
        id: savedSearchId,
        employerId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Saved search not found.');
    }

    await this.prisma.savedSearch.delete({
      where: {
        id: savedSearchId,
      },
    });

    return { success: true };
  }

  private mapSavedSearch(search: {
    id: string;
    name: string;
    query: string | null;
    location: string | null;
    tagId: string | null;
    createdAt: Date;
    updatedAt: Date;
    tag: { id: string; name: string } | null;
  }) {
    return {
      id: search.id,
      name: search.name,
      query: search.query,
      location: search.location,
      tagId: search.tagId,
      tag: search.tag
        ? {
            id: search.tag.id,
            name: search.tag.name,
          }
        : null,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
    };
  }
}
