import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';

type MockedPrisma = {
  tag: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  cv: {
    findUnique: jest.Mock;
  };
  savedSearch: {
    findMany: jest.Mock;
    update: jest.Mock;
  };
  cVTag: {
    count: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
};

describe('TagsService', () => {
  let service: TagsService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      tag: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      cv: {
        findUnique: jest.fn(),
      },
      savedSearch: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      cVTag: {
        count: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    service = new TagsService(prisma as unknown as PrismaService);
  });

  it('returns tags ordered by name', async () => {
    prisma.tag.findMany.mockResolvedValue([{ id: 'tag-1', name: 'NestJS' }]);

    const result = await service.getAllTags();

    expect(prisma.tag.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual([{ id: 'tag-1', name: 'NestJS' }]);
  });

  it('returns admin tags with usage counts', async () => {
    prisma.tag.findMany.mockResolvedValue([
      {
        id: 'tag-1',
        name: 'NestJS',
        createdAt: new Date('2026-05-24T09:00:00.000Z'),
        updatedAt: new Date('2026-05-24T10:00:00.000Z'),
        _count: {
          cvs: 2,
          savedSearches: 1,
        },
      },
    ]);

    const result = await service.getAdminTags();

    expect(result).toEqual([
      {
        id: 'tag-1',
        name: 'NestJS',
        createdAt: new Date('2026-05-24T09:00:00.000Z'),
        updatedAt: new Date('2026-05-24T10:00:00.000Z'),
        cvCount: 2,
        savedSearchCount: 1,
      },
    ]);
  });

  it('throws when fetching tags for a missing cv', async () => {
    prisma.cv.findUnique.mockResolvedValue(null);

    await expect(service.getMyTags('user-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects adding more than 20 tags', async () => {
    prisma.cv.findUnique.mockResolvedValue({ id: 'cv-1' });
    prisma.cVTag.count.mockResolvedValue(20);

    await expect(service.attachTag('user-1', 'tag-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('translates duplicate attachment failures into a bad request', async () => {
    prisma.cv.findUnique.mockResolvedValue({ id: 'cv-1' });
    prisma.cVTag.count.mockResolvedValue(1);
    prisma.cVTag.create.mockRejectedValue(new Error('duplicate'));

    await expect(service.attachTag('user-1', 'tag-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('removes a tag from the current user cv', async () => {
    prisma.cv.findUnique.mockResolvedValue({ id: 'cv-1' });

    const result = await service.removeTag('user-1', 'tag-1');

    expect(prisma.cVTag.deleteMany).toHaveBeenCalledWith({
      where: {
        cvId: 'cv-1',
        tagId: 'tag-1',
      },
    });
    expect(result).toEqual({ message: 'Tag removed successfully' });
  });

  it('renames an existing tag', async () => {
    prisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', name: 'NestJS' });
    prisma.tag.update.mockResolvedValue({
      id: 'tag-1',
      name: 'Node.js',
      createdAt: new Date('2026-05-24T09:00:00.000Z'),
      updatedAt: new Date('2026-05-24T11:00:00.000Z'),
      _count: {
        cvs: 3,
        savedSearches: 2,
      },
    });

    const result = await service.renameTag('tag-1', 'Node.js');

    expect(prisma.tag.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'tag-1' },
        data: { name: 'Node.js' },
      }),
    );
    expect(result.name).toBe('Node.js');
  });

  it('cleans saved search references before deleting a tag', async () => {
    prisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', name: 'NestJS' });
    prisma.savedSearch.findMany.mockResolvedValue([
      {
        id: 'saved-1',
        tagId: 'tag-1',
        tagIdsJson: JSON.stringify(['tag-1', 'tag-2']),
        tagMode: 'ALL',
      },
    ]);

    const result = await service.deleteTag('tag-1');

    expect(prisma.savedSearch.update).toHaveBeenCalledWith({
      where: { id: 'saved-1' },
      data: {
        tagId: 'tag-2',
        tagIdsJson: JSON.stringify(['tag-2']),
        tagMode: null,
      },
    });
    expect(prisma.tag.delete).toHaveBeenCalledWith({
      where: { id: 'tag-1' },
    });
    expect(result).toEqual({ success: true });
  });
});
