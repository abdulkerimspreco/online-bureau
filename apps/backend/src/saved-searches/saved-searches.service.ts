import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SearchTagMode, UserRole } from '@prisma/client';
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
    const tagIds = Array.from(
      new Set([...(dto.tagIds ?? []), ...(dto.tagId ? [dto.tagId] : [])]),
    );
    const tagId = tagIds.length === 1 ? tagIds[0] : null;
    const tagMode =
      tagIds.length > 1 ? dto.tagMode ?? SearchTagMode.ANY : dto.tagMode ?? null;

    if (!query && !location && tagIds.length === 0) {
      throw new BadRequestException(
        'Add at least one filter before saving a search.',
      );
    }

    if (tagIds.length > 0) {
      const existingTags = await this.prisma.tag.findMany({
        where: { id: { in: tagIds } },
        select: { id: true, name: true },
      });

      if (existingTags.length !== tagIds.length) {
        throw new NotFoundException('One or more selected tags were not found.');
      }
    }

    const savedSearch = await this.prisma.savedSearch.create({
      data: {
        employerId: user.id,
        name,
        query,
        location,
        tagId,
        tagIdsJson: tagIds.length > 0 ? JSON.stringify(tagIds) : null,
        tagMode,
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

    const additionalTagIds = Array.from(
      new Set(
        searches.flatMap((search) => {
          if (!search.tagIdsJson) return [];
          try {
            const parsed = JSON.parse(search.tagIdsJson) as string[];
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }),
      ),
    );

    const extraTags =
      additionalTagIds.length > 0
        ? await this.prisma.tag.findMany({
            where: {
              id: {
                in: additionalTagIds,
              },
            },
            select: {
              id: true,
              name: true,
            },
          })
        : [];

    const tagMap = new Map(extraTags.map((tag) => [tag.id, tag]));

    return searches.map((search) => this.mapSavedSearch(search, tagMap));
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
    tagIdsJson: string | null;
    tagMode: SearchTagMode | null;
    createdAt: Date;
    updatedAt: Date;
    tag: { id: string; name: string } | null;
  }, tagMap?: Map<string, { id: string; name: string }>) {
    let parsedTagIds: string[] = [];

    if (search.tagIdsJson) {
      try {
        const value = JSON.parse(search.tagIdsJson) as string[];
        parsedTagIds = Array.isArray(value) ? value : [];
      } catch {
        parsedTagIds = [];
      }
    } else if (search.tagId) {
      parsedTagIds = [search.tagId];
    }

    const tags = parsedTagIds
      .map((tagId) =>
        search.tag?.id === tagId ? search.tag : tagMap?.get(tagId) ?? null,
      )
      .filter((tag): tag is { id: string; name: string } => Boolean(tag));

    return {
      id: search.id,
      name: search.name,
      query: search.query,
      location: search.location,
      tagId: search.tagId,
      tagIds: parsedTagIds,
      tagMode: search.tagMode ?? null,
      tag: search.tag
        ? {
            id: search.tag.id,
            name: search.tag.name,
          }
        : null,
      tags,
      createdAt: search.createdAt,
      updatedAt: search.updatedAt,
    };
  }
}
