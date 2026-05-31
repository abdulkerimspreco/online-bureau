import { Injectable } from '@nestjs/common';
import { OpsAlertSeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type ThresholdDefinition = {
  metricKey: string;
  route: string;
  thresholdMs: number;
  description: string;
};

@Injectable()
export class OpsMonitoringService {
  private static readonly startedAt = new Date();

  private static readonly THRESHOLDS: ThresholdDefinition[] = [
    {
      metricKey: 'candidate_search_latency',
      route: 'GET /employers/search',
      thresholdMs: 2000,
      description: 'Employer candidate search should complete within 2 seconds.',
    },
    {
      metricKey: 'cv_upload_latency',
      route: 'POST /cv/upload',
      thresholdMs: 5000,
      description: 'CV upload and encryption should complete within 5 seconds for 10 MB files.',
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  static get thresholds() {
    return OpsMonitoringService.THRESHOLDS;
  }

  getMatchedThreshold(method: string, path: string) {
    const normalized = `${method.toUpperCase()} ${path}`;
    return OpsMonitoringService.THRESHOLDS.find(
      (threshold) => threshold.route === normalized,
    );
  }

  async recordThresholdBreach(input: {
    metricKey: string;
    route: string;
    thresholdMs: number;
    observedMs: number;
  }) {
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    const existingRecentAlert = await this.prisma.opsAlert.findFirst({
      where: {
        metricKey: input.metricKey,
        route: input.route,
        resolvedAt: null,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existingRecentAlert) {
      return existingRecentAlert;
    }

    const severity =
      input.observedMs >= input.thresholdMs * 2
        ? OpsAlertSeverity.CRITICAL
        : OpsAlertSeverity.WARN;

    return this.prisma.opsAlert.create({
      data: {
        metricKey: input.metricKey,
        route: input.route,
        thresholdMs: input.thresholdMs,
        observedMs: input.observedMs,
        severity,
        message: `${input.route} exceeded ${input.thresholdMs}ms with an observed duration of ${input.observedMs}ms.`,
      },
    });
  }

  async getPublicHealth() {
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentAlertCount = await this.prisma.opsAlert.count({
      where: {
        createdAt: {
          gte: lastHour,
        },
      },
    });

    return {
      status: recentAlertCount > 0 ? 'degraded' : 'healthy',
      startedAt: OpsMonitoringService.startedAt,
      uptimeSeconds: Math.floor(
        (Date.now() - OpsMonitoringService.startedAt.getTime()) / 1000,
      ),
      recentAlertCount,
      thresholds: OpsMonitoringService.THRESHOLDS.map((threshold) => ({
        metricKey: threshold.metricKey,
        route: threshold.route,
        thresholdMs: threshold.thresholdMs,
      })),
    };
  }

  async getAdminOpsSummary() {
    const [health, recentAlerts] = await Promise.all([
      this.getPublicHealth(),
      this.prisma.opsAlert.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 25,
      }),
    ]);

    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [criticalAlertsLast24Hours, totalAlertsLast24Hours] =
      await Promise.all([
        this.prisma.opsAlert.count({
          where: {
            severity: OpsAlertSeverity.CRITICAL,
            createdAt: {
              gte: last24Hours,
            },
          },
        }),
        this.prisma.opsAlert.count({
          where: {
            createdAt: {
              gte: last24Hours,
            },
          },
        }),
      ]);

    return {
      ...health,
      summary: {
        criticalAlertsLast24Hours,
        totalAlertsLast24Hours,
        uptimeTarget: '99.5% rolling 30-day uptime',
      },
      thresholds: OpsMonitoringService.THRESHOLDS,
      alerts: recentAlerts,
    };
  }
}
