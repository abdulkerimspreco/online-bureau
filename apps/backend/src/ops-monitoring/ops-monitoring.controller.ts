import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { OpsMonitoringService } from './ops-monitoring.service';

@Controller('admin/ops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminOpsMonitoringController {
  constructor(private readonly opsMonitoringService: OpsMonitoringService) {}

  @Get()
  getSummary() {
    return this.opsMonitoringService.getAdminOpsSummary();
  }
}
