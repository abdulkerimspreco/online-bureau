import { NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

type MockedPrisma = {
  notification: {
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    findFirst: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
  };
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it('creates a notification', async () => {
    prisma.notification.create.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      type: NotificationType.CONTACT_REQUEST_SENT,
      title: 'New request',
      message: 'You received a request.',
      linkUrl: '/job-seeker/dashboard',
      readAt: null,
      createdAt: new Date('2026-05-05T18:00:00.000Z'),
    });

    const result = await service.create({
      userId: 'user-1',
      type: NotificationType.CONTACT_REQUEST_SENT,
      title: 'New request',
      message: 'You received a request.',
      linkUrl: '/job-seeker/dashboard',
    });

    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: NotificationType.CONTACT_REQUEST_SENT,
        title: 'New request',
        message: 'You received a request.',
        linkUrl: '/job-seeker/dashboard',
      },
    });
    expect(result.id).toBe('notif-1');
  });

  it('returns unread count', async () => {
    prisma.notification.count.mockResolvedValue(3);

    await expect(service.getUnreadCount('user-1')).resolves.toEqual({ count: 3 });
  });

  it('marks a notification as read', async () => {
    prisma.notification.findFirst.mockResolvedValue({
      id: 'notif-1',
      userId: 'user-1',
      readAt: null,
    });
    prisma.notification.update.mockResolvedValue({
      id: 'notif-1',
      readAt: new Date('2026-05-05T18:30:00.000Z'),
    });

    const result = await service.markAsRead('user-1', 'notif-1');

    expect(result.id).toBe('notif-1');
    expect(prisma.notification.update).toHaveBeenCalled();
  });

  it('throws when marking another users notification', async () => {
    prisma.notification.findFirst.mockResolvedValue(null);

    await expect(service.markAsRead('user-1', 'notif-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
