import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetAdminAnalyticsDto } from './dto/get-admin-analytics.dto';

type DailyPoint = {
  date: string;
  registrations: number;
  contactRequests: number;
  activeCvs: number;
};

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveRange(dto: GetAdminAnalyticsDto) {
    const today = new Date();
    const end = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
      23,
      59,
      59,
      999,
    ));

    const preset = dto.preset ?? '30';

    if (preset === 'custom') {
      if (!dto.startDate || !dto.endDate) {
        throw new BadRequestException('Custom range requires both start and end dates.');
      }

      const start = new Date(`${dto.startDate}T00:00:00.000Z`);
      const customEnd = new Date(`${dto.endDate}T23:59:59.999Z`);

      if (Number.isNaN(start.getTime()) || Number.isNaN(customEnd.getTime())) {
        throw new BadRequestException('Invalid custom date range.');
      }

      if (start > customEnd) {
        throw new BadRequestException('Start date must be before end date.');
      }

      return {
        preset,
        start,
        end: customEnd,
        label: `${dto.startDate} to ${dto.endDate}`,
      };
    }

    const days = Number(preset);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    start.setUTCHours(0, 0, 0, 0);

    return {
      preset,
      start,
      end,
      label: `Last ${days} days`,
    };
  }

  private toDayKey(date: Date) {
    return date.toISOString().slice(0, 10);
  }

  private buildEmptySeries(start: Date, end: Date): DailyPoint[] {
    const points: DailyPoint[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      points.push({
        date: this.toDayKey(cursor),
        registrations: 0,
        contactRequests: 0,
        activeCvs: 0,
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return points;
  }

  async getAnalytics(dto: GetAdminAnalyticsDto) {
    const range = this.resolveRange(dto);

    const [totalUsers, totalCvs, usersInRange, contactRequestsInRange, cvsInRange] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.cv.count(),
        this.prisma.user.findMany({
          where: {
            createdAt: {
              gte: range.start,
              lte: range.end,
            },
          },
          select: {
            createdAt: true,
          },
        }),
        this.prisma.contactRequest.findMany({
          where: {
            createdAt: {
              gte: range.start,
              lte: range.end,
            },
          },
          select: {
            createdAt: true,
          },
        }),
        this.prisma.cv.findMany({
          where: {
            createdAt: {
              gte: range.start,
              lte: range.end,
            },
          },
          select: {
            createdAt: true,
          },
        }),
      ]);

    const series = this.buildEmptySeries(range.start, range.end);
    const seriesMap = new Map(series.map((point) => [point.date, point]));

    for (const user of usersInRange) {
      const key = this.toDayKey(user.createdAt);
      const point = seriesMap.get(key);
      if (point) point.registrations += 1;
    }

    for (const request of contactRequestsInRange) {
      const key = this.toDayKey(request.createdAt);
      const point = seriesMap.get(key);
      if (point) point.contactRequests += 1;
    }

    for (const cv of cvsInRange) {
      const key = this.toDayKey(cv.createdAt);
      const point = seriesMap.get(key);
      if (point) point.activeCvs += 1;
    }

    return {
      range: {
        preset: range.preset,
        label: range.label,
        startDate: this.toDayKey(range.start),
        endDate: this.toDayKey(range.end),
      },
      summary: {
        totalUsers,
        activeCvCount: totalCvs,
        contactRequestsSent: contactRequestsInRange.length,
        registrationsInRange: usersInRange.length,
        cvsInRange: cvsInRange.length,
      },
      series,
    };
  }
}
