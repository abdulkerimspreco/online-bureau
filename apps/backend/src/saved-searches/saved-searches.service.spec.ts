import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SavedSearchesService } from './saved-searches.service';

type MockedPrisma = {
  tag: {
    findUnique: jest.Mock;
  };
  savedSearch: {
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    delete: jest.Mock;
  };
};

describe('SavedSearchesService', () => {
  let service: SavedSearchesService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      tag: {
        findUnique: jest.fn(),
      },
      savedSearch: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new SavedSearchesService(prisma as unknown as PrismaService);
  });

  it('rejects saving an empty search', async () => {
    await expect(
      service.createForEmployer(
        {
          id: 'emp-1',
          email: 'employer@example.com',
          role: UserRole.EMPLOYER,
          isVerified: true,
        },
        { name: 'Empty search' },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a saved search with tag details', async () => {
    prisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', name: 'NestJS' });
    prisma.savedSearch.create.mockResolvedValue({
      id: 'search-1',
      name: 'Backend Sarajevo',
      query: 'backend',
      location: 'Sarajevo',
      tagId: 'tag-1',
      createdAt: new Date('2026-05-04T22:00:00.000Z'),
      updatedAt: new Date('2026-05-04T22:00:00.000Z'),
      tag: { id: 'tag-1', name: 'NestJS' },
    });

    const result = await service.createForEmployer(
      {
        id: 'emp-1',
        email: 'employer@example.com',
        role: UserRole.EMPLOYER,
        isVerified: true,
      },
      {
        name: 'Backend Sarajevo',
        query: 'backend',
        location: 'Sarajevo',
        tagId: 'tag-1',
      },
    );

    expect(result.tag?.name).toBe('NestJS');
    expect(prisma.savedSearch.create).toHaveBeenCalled();
  });

  it('lists employer saved searches', async () => {
    prisma.savedSearch.findMany.mockResolvedValue([
      {
        id: 'search-1',
        name: 'Backend Sarajevo',
        query: 'backend',
        location: 'Sarajevo',
        tagId: null,
        createdAt: new Date('2026-05-04T22:00:00.000Z'),
        updatedAt: new Date('2026-05-04T22:00:00.000Z'),
        tag: null,
      },
    ]);

    const result = await service.listForEmployer('emp-1');

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Backend Sarajevo');
  });

  it('throws when deleting a missing saved search', async () => {
    prisma.savedSearch.findFirst.mockResolvedValue(null);

    await expect(
      service.deleteForEmployer('emp-1', 'search-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
