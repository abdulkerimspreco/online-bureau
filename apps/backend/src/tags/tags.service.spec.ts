import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TagsService } from './tags.service';
import { PrismaService } from '../prisma/prisma.service';

type MockedPrisma = {
  tag: {
    findMany: jest.Mock;
    create: jest.Mock;
  };
  cv: {
    findUnique: jest.Mock;
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
        create: jest.fn(),
      },
      cv: {
        findUnique: jest.fn(),
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
});
