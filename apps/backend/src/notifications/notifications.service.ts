import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl?: string | null;
};

@Injectable()
export class NotificationsService {
  private static readonly RETENTION_DAYS = 90;

  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateNotificationInput) {
    return this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        linkUrl: input.linkUrl ?? null,
      },
    });
  }

  async listForUser(userId: string, onlyUnread = false) {
    const retentionCutoff = new Date();
    retentionCutoff.setDate(
      retentionCutoff.getDate() - NotificationsService.RETENTION_DAYS,
    );

    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        createdAt: {
          gte: retentionCutoff,
        },
        ...(onlyUnread
          ? {
              readAt: null,
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      linkUrl: notification.linkUrl,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
    }));
  }

  async getUnreadCount(userId: string) {
    const retentionCutoff = new Date();
    retentionCutoff.setDate(
      retentionCutoff.getDate() - NotificationsService.RETENTION_DAYS,
    );

    const count = await this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
        createdAt: {
          gte: retentionCutoff,
        },
      },
    });

    return { count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    if (notification.readAt) {
      return {
        id: notification.id,
        readAt: notification.readAt,
      };
    }

    const updated = await this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      id: updated.id,
      readAt: updated.readAt,
    };
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      updatedCount: result.count,
    };
  }

  async clearAll(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        userId,
      },
    });

    return {
      deletedCount: result.count,
    };
  }
}
