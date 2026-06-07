import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminOpsMonitoringController } from './ops-monitoring.controller';
import { HealthController } from './health.controller';
import { OpsMonitoringInterceptor } from './ops-monitoring.interceptor';
import { OpsMonitoringService } from './ops-monitoring.service';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController, AdminOpsMonitoringController],
  providers: [
    OpsMonitoringService,
    {
      provide: APP_INTERCEPTOR,
      useClass: OpsMonitoringInterceptor,
    },
  ],
})
export class OpsMonitoringModule {}
