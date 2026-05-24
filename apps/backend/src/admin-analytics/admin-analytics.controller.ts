import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminAnalyticsService } from './admin-analytics.service';
import { GetAdminAnalyticsDto } from './dto/get-admin-analytics.dto';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsService: AdminAnalyticsService) {}

  @Get()
  getAnalytics(@Query() dto: GetAdminAnalyticsDto) {
    return this.adminAnalyticsService.getAnalytics(dto);
  }
}
