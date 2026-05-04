import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import {
  RespondContactRequestDto,
} from './dto/respond-contact-request.dto';
import { ContactRequestsService } from './contact-requests.service';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Controller('contact-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContactRequestsController {
  constructor(
    private readonly contactRequestsService: ContactRequestsService,
  ) {}

  @Post('employer')
  @Roles(UserRole.EMPLOYER)
  createForEmployer(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateContactRequestDto,
  ) {
    return this.contactRequestsService.createForEmployer(user, dto);
  }

  @Get('job-seeker/pending')
  @Roles(UserRole.JOB_SEEKER)
  getPendingForJobSeeker(@CurrentUser() user: AuthUser) {
    return this.contactRequestsService.getPendingForCandidate(user.id);
  }

  @Get('job-seeker/history')
  @Roles(UserRole.JOB_SEEKER)
  getHistoryForJobSeeker(@CurrentUser() user: AuthUser) {
    return this.contactRequestsService.getHistoryForCandidate(user.id);
  }

  @Patch('job-seeker/:requestId/respond')
  @Roles(UserRole.JOB_SEEKER)
  respondToRequest(
    @CurrentUser() user: AuthUser,
    @Param('requestId') requestId: string,
    @Body() dto: RespondContactRequestDto,
  ) {
    return this.contactRequestsService.respondToCandidateRequest(
      user.id,
      requestId,
      dto,
    );
  }

  @Get('employer/history')
  @Roles(UserRole.EMPLOYER)
  getHistoryForEmployer(@CurrentUser() user: AuthUser) {
    return this.contactRequestsService.getHistoryForEmployer(user.id);
  }
}
