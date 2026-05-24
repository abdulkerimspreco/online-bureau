import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CVVisibility, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ShortlistService } from './shortlist.service';

type MockedPrisma = {
  cv: {
    findFirst: jest.Mock;
  };
  shortlistFolder: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
  shortlistFolderEntry: {
    findUnique: jest.Mock;
    create: jest.Mock;
    delete: jest.Mock;
  };
  shortlistEntry: {
    findUnique: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    findFirst: jest.Mock;
    delete: jest.Mock;
  };
  contactRequest: {
    findFirst: jest.Mock;
  };
};

describe('ShortlistService', () => {
  let service: ShortlistService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      cv: {
        findFirst: jest.fn(),
      },
      shortlistFolder: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      shortlistFolderEntry: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      shortlistEntry: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      contactRequest: {
        findFirst: jest.fn(),
      },
    };

    service = new ShortlistService(prisma as unknown as PrismaService);
  });

  it('blocks shortlisting your own account', async () => {
    await expect(
      service.addForEmployer(
        {
          id: 'emp-1',
          email: 'employer@example.com',
          role: UserRole.EMPLOYER,
          isVerified: true,
        },
        'emp-1',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('adds a visible candidate to shortlist', async () => {
    prisma.cv.findFirst.mockResolvedValue({
      id: 'cv-1',
      visibility: CVVisibility.PUBLIC,
    });
    prisma.shortlistEntry.findUnique.mockResolvedValue(null);
    prisma.shortlistEntry.create.mockResolvedValue({
      id: 'short-1',
      employerId: 'emp-1',
      candidateId: 'cand-1',
    });

    const result = await service.addForEmployer(
      {
        id: 'emp-1',
        email: 'employer@example.com',
        role: UserRole.EMPLOYER,
        isVerified: true,
      },
      'cand-1',
    );

    expect(result.id).toBe('short-1');
  });

  it('creates a shortlist folder', async () => {
    prisma.shortlistFolder.create.mockResolvedValue({
      id: 'folder-1',
      employerId: 'emp-1',
      name: 'Frontend',
    });

    const result = await service.createFolderForEmployer('emp-1', 'Frontend');

    expect(result.id).toBe('folder-1');
    expect(prisma.shortlistFolder.create).toHaveBeenCalledWith({
      data: {
        employerId: 'emp-1',
        name: 'Frontend',
      },
    });
  });

  it('lists shortlist folders with counts', async () => {
    prisma.shortlistFolder.findMany.mockResolvedValue([
      {
        id: 'folder-1',
        employerId: 'emp-1',
        name: 'Frontend',
        createdAt: new Date('2026-05-24T10:00:00.000Z'),
        updatedAt: new Date('2026-05-24T10:00:00.000Z'),
        entries: [{ shortlistEntryId: 'short-1' }, { shortlistEntryId: 'short-2' }],
      },
    ]);

    const result = await service.listFoldersForEmployer('emp-1');

    expect(result).toEqual([
      expect.objectContaining({
        id: 'folder-1',
        name: 'Frontend',
        entryCount: 2,
        shortlistEntryIds: ['short-1', 'short-2'],
      }),
    ]);
  });

  it('adds a shortlist entry to a folder', async () => {
    prisma.shortlistFolder.findFirst.mockResolvedValue({
      id: 'folder-1',
      employerId: 'emp-1',
    });
    prisma.shortlistEntry.findFirst.mockResolvedValue({
      id: 'short-1',
      employerId: 'emp-1',
    });
    prisma.shortlistFolderEntry.findUnique.mockResolvedValue(null);
    prisma.shortlistFolderEntry.create.mockResolvedValue({
      folderId: 'folder-1',
      shortlistEntryId: 'short-1',
    });

    await service.addEntryToFolderForEmployer('emp-1', 'folder-1', 'short-1');

    expect(prisma.shortlistFolderEntry.create).toHaveBeenCalledWith({
      data: {
        folderId: 'folder-1',
        shortlistEntryId: 'short-1',
      },
    });
  });

  it('throws when removing a missing shortlist entry', async () => {
    prisma.shortlistEntry.findFirst.mockResolvedValue(null);

    await expect(
      service.removeForEmployer('emp-1', 'short-1'),
    ).rejects.toThrow(NotFoundException);
  });
});
