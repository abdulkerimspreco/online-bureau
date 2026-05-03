import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateJobSeekerProfileDto } from './dto/update-job-seeker-profile.dto';
import { JobSeekersService } from './job-seekers.service';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Controller('job-seekers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.JOB_SEEKER)
export class JobSeekersController {
  constructor(private readonly jobSeekersService: JobSeekersService) {}

  @Get('getMyProfile')
  getMyProfile(@CurrentUser() user: AuthUser) {
    return this.jobSeekersService.getMyProfile(user.id);
  }

  @Patch('updateMyProfile')
  updateMyProfile(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateJobSeekerProfileDto,
  ) {
    return this.jobSeekersService.updateMyProfile(user.id, dto);
  }
}
