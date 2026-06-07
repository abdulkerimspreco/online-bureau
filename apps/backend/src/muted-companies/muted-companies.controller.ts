import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MutedCompaniesService } from './muted-companies.service';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Controller('muted-companies')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.JOB_SEEKER)
export class MutedCompaniesController {
  constructor(private readonly mutedCompaniesService: MutedCompaniesService) {}

  @Get('job-seeker/me')
  listForCandidate(@CurrentUser() user: AuthUser) {
    return this.mutedCompaniesService.listForCandidate(user.id);
  }

  @Post('job-seeker/:employerId')
  muteForCandidate(
    @CurrentUser() user: AuthUser,
    @Param('employerId') employerId: string,
  ) {
    return this.mutedCompaniesService.muteForCandidate(user.id, employerId);
  }

  @Delete('job-seeker/:employerId')
  unmuteForCandidate(
    @CurrentUser() user: AuthUser,
    @Param('employerId') employerId: string,
  ) {
    return this.mutedCompaniesService.unmuteForCandidate(user.id, employerId);
  }
}
