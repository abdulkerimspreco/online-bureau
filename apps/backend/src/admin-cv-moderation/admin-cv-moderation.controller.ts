import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminCvModerationService } from './admin-cv-moderation.service';
import { CreateCvModerationCaseDto } from './dto/create-cv-moderation-case.dto';
import { ListCvModerationCandidatesDto } from './dto/list-cv-moderation-candidates.dto';
import { ResolveCvModerationCaseDto } from './dto/resolve-cv-moderation-case.dto';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Controller('admin/cv-moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCvModerationController {
  constructor(
    private readonly adminCvModerationService: AdminCvModerationService,
  ) {}

  @Get('candidates')
  listCandidates(@Query() dto: ListCvModerationCandidatesDto) {
    return this.adminCvModerationService.listCandidates(dto);
  }

  @Get('cases')
  listCases(@CurrentUser() user: AuthUser) {
    return this.adminCvModerationService.listCasesForAdmin(user.id);
  }

  @Post('cases')
  createCase(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCvModerationCaseDto,
  ) {
    return this.adminCvModerationService.createCase(user.id, dto);
  }

  @Get('cases/:caseId/file')
  async getPreviewFile(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.adminCvModerationService.getPreviewFile(
      user.id,
      caseId,
    );
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(file.fileName)}"`,
    );
    return new StreamableFile(file.buffer);
  }

  @Patch('cases/:caseId/outcome')
  resolveCase(
    @CurrentUser() user: AuthUser,
    @Param('caseId') caseId: string,
    @Body() dto: ResolveCvModerationCaseDto,
  ) {
    return this.adminCvModerationService.resolveCase(user.id, caseId, dto);
  }
}
