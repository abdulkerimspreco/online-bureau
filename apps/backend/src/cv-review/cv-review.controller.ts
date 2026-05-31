import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CvReviewService } from './cv-review.service';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Controller('cv-review')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.JOB_SEEKER)
export class CvReviewController {
  constructor(private readonly cvReviewService: CvReviewService) {}

  @Get('me')
  getMyLatestReview(@CurrentUser() user: AuthUser) {
    return this.cvReviewService.getLatestForUser(user.id);
  }

  @Post('me')
  createReview(@CurrentUser() user: AuthUser) {
    return this.cvReviewService.createForUser(user.id);
  }
}
