import { OpsAlertSeverity } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OpsMonitoringService } from './ops-monitoring.service';

type MockedPrisma = {
  opsAlert: {
    findFirst: jest.Mock;
    create: jest.Mock;
    count: jest.Mock;
    findMany: jest.Mock;
  };
};

describe('OpsMonitoringService', () => {
  let service: OpsMonitoringService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      opsAlert: {
        findFirst: jest.fn(),
        create: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new OpsMonitoringService(prisma as unknown as PrismaService);
  });

  it('creates an alert for a threshold breach', async () => {
    prisma.opsAlert.findFirst.mockResolvedValue(null);
    prisma.opsAlert.create.mockResolvedValue({
      id: 'alert-1',
      severity: OpsAlertSeverity.WARN,
    });

    const result = await service.recordThresholdBreach({
      metricKey: 'candidate_search_latency',
      route: 'GET /employers/search',
      thresholdMs: 2000,
      observedMs: 2400,
    });

    expect(prisma.opsAlert.create).toHaveBeenCalled();
    expect(result.id).toBe('alert-1');
  });

  it('returns recent system health and thresholds', async () => {
    prisma.opsAlert.count.mockResolvedValue(0);

    const result = await service.getPublicHealth();

    expect(result.status).toBe('healthy');
    expect(result.thresholds).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metricKey: 'candidate_search_latency',
        }),
      ]),
    );
  });
});
