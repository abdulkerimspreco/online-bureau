import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminCvModerationService } from './admin-cv-moderation.service';
import { RespondCvModerationCaseDto } from './dto/respond-cv-moderation-case.dto';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Controller('cv-moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.JOB_SEEKER)
export class CvModerationController {
  constructor(
    private readonly adminCvModerationService: AdminCvModerationService,
  ) {}

  @Get('me')
  listMyCases(@CurrentUser() user: AuthUser) {
    return this.adminCvModerationService.listCasesForCandidate(user.id);
  }

  @Patch('me/:caseId/decision')
  respondToCase(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: RespondCvModerationCaseDto,
  ) {
    return this.adminCvModerationService.respondToCase(user.id, caseId, dto);
  }
}
