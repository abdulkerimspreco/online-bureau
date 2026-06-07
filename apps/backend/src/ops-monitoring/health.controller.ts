import { Controller, Get } from '@nestjs/common';
import { OpsMonitoringService } from './ops-monitoring.service';

@Controller('ops')
export class HealthController {
  constructor(private readonly opsMonitoringService: OpsMonitoringService) {}

  @Get('health')
  getHealth() {
    return this.opsMonitoringService.getPublicHealth();
  }
}
