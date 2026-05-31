import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CustomTagRequestStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { TagsService } from './tags.service';

type MockedPrisma = {
  tag: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
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
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  customTagRequest: {
    findMany: jest.Mock;
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
};

describe('TagsService', () => {
  let service: TagsService;
  let prisma: MockedPrisma;
  let notificationsService: { create: jest.Mock };

  beforeEach(() => {
    prisma = {
      tag: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
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
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      customTagRequest: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    notificationsService = {
      create: jest.fn(),
    };

    service = new TagsService(
      prisma as unknown as PrismaService,
      notificationsService as unknown as NotificationsService,
    );
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

  it('creates a custom tag request for a job seeker cv', async () => {
    prisma.cv.findUnique.mockResolvedValue({
      id: 'cv-1',
      tags: [],
    });
    prisma.tag.findFirst.mockResolvedValue(null);
    prisma.customTagRequest.findFirst.mockResolvedValue(null);
    prisma.customTagRequest.create.mockResolvedValue({
      id: 'request-1',
      requestedName: 'Rust',
      status: CustomTagRequestStatus.PENDING,
      createdAt: new Date('2026-05-31T13:00:00.000Z'),
      updatedAt: new Date('2026-05-31T13:00:00.000Z'),
      reviewedAt: null,
      tag: null,
      reviewedBy: null,
    });

    const result = await service.createCustomTagRequest('user-1', ' Rust ');

    expect(prisma.customTagRequest.create).toHaveBeenCalledWith({
      data: {
        requesterId: 'user-1',
        requestedName: 'Rust',
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
    expect(result.requestedName).toBe('Rust');
    expect(result.status).toBe(CustomTagRequestStatus.PENDING);
  });

  it('approves a custom tag request and notifies the requester', async () => {
    prisma.customTagRequest.findUnique.mockResolvedValue({
      id: 'request-1',
      requesterId: 'candidate-1',
      requestedName: 'Rust',
      status: CustomTagRequestStatus.PENDING,
      requester: {
        id: 'candidate-1',
        email: 'test@seeker.com',
      },
    });
    prisma.tag.findFirst.mockResolvedValue(null);
    prisma.tag.create.mockResolvedValue({
      id: 'tag-rust',
      name: 'Rust',
    });
    prisma.cv.findUnique.mockResolvedValue({
      id: 'cv-1',
    });
    prisma.cVTag.findUnique.mockResolvedValue(null);
    prisma.cVTag.count.mockResolvedValue(2);
    prisma.customTagRequest.update.mockResolvedValue({
      id: 'request-1',
      requestedName: 'Rust',
      status: CustomTagRequestStatus.APPROVED,
      createdAt: new Date('2026-05-31T13:00:00.000Z'),
      updatedAt: new Date('2026-05-31T13:10:00.000Z'),
      reviewedAt: new Date('2026-05-31T13:10:00.000Z'),
      tag: {
        id: 'tag-rust',
        name: 'Rust',
      },
      requester: {
        id: 'candidate-1',
        email: 'test@seeker.com',
        jobSeekerProfile: {
          displayName: 'Candidate',
        },
      },
      reviewedBy: {
        email: 'js@example.com',
      },
    });

    const result = await service.approveCustomTagRequest(
      'admin-1',
      'request-1',
    );

    expect(prisma.cVTag.create).toHaveBeenCalledWith({
      data: {
        cvId: 'cv-1',
        tagId: 'tag-rust',
      },
    });
    expect(notificationsService.create).toHaveBeenCalledWith({
      userId: 'candidate-1',
      type: NotificationType.TAG_REQUEST_APPROVED,
      title: 'Custom tag approved',
      message:
        'Your custom tag request for "Rust" was approved and attached to your CV.',
      linkUrl: '/job-seeker/tags',
    });
    expect(result.status).toBe(CustomTagRequestStatus.APPROVED);
  });

  it('renames an existing tag and notifies affected users', async () => {
    prisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', name: 'NestJS' });
    prisma.tag.findFirst.mockResolvedValue(null);
    prisma.cVTag.findMany.mockResolvedValue([
      {
        cv: {
          userId: 'candidate-1',
        },
      },
    ]);
    prisma.savedSearch.findMany
      .mockResolvedValueOnce([{ employerId: 'employer-1' }])
      .mockResolvedValueOnce([]);
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

    expect(result.name).toBe('Node.js');
    expect(notificationsService.create).toHaveBeenCalledWith({
      userId: 'candidate-1',
      type: NotificationType.TAG_UPDATED,
      title: 'A CV tag was updated',
      message: 'Your "NestJS" CV tag is now called "Node.js".',
      linkUrl: '/job-seeker/tags',
    });
    expect(notificationsService.create).toHaveBeenCalledWith({
      userId: 'employer-1',
      type: NotificationType.TAG_UPDATED,
      title: 'A saved-search tag was updated',
      message:
        'A saved-search tag you used was renamed from "NestJS" to "Node.js".',
      linkUrl: '/employer/search',
    });
  });

  it('cleans saved search references before deleting a tag and notifies users', async () => {
    prisma.tag.findUnique.mockResolvedValue({ id: 'tag-1', name: 'NestJS' });
    prisma.cVTag.findMany.mockResolvedValue([
      {
        cv: {
          userId: 'candidate-1',
        },
      },
    ]);
    prisma.savedSearch.findMany
      .mockResolvedValueOnce([{ employerId: 'employer-1' }])
      .mockResolvedValueOnce([
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
    expect(notificationsService.create).toHaveBeenCalledWith({
      userId: 'candidate-1',
      type: NotificationType.TAG_REMOVED,
      title: 'A CV tag was removed',
      message: 'The "NestJS" tag was retired and removed from your CV.',
      linkUrl: '/job-seeker/tags',
    });
    expect(notificationsService.create).toHaveBeenCalledWith({
      userId: 'employer-1',
      type: NotificationType.TAG_REMOVED,
      title: 'A saved-search tag was removed',
      message:
        'The "NestJS" tag was retired and removed from your saved search filters.',
      linkUrl: '/employer/search',
    });
    expect(result).toEqual({ success: true });
  });
});
