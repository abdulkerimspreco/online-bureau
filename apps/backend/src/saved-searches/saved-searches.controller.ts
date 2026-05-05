import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';
import { SavedSearchesService } from './saved-searches.service';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Controller('saved-searches')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
export class SavedSearchesController {
  constructor(private readonly savedSearchesService: SavedSearchesService) {}

  @Get('employer/me')
  listForEmployer(@CurrentUser() user: AuthUser) {
    return this.savedSearchesService.listForEmployer(user.id);
  }

  @Post('employer')
  createForEmployer(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateSavedSearchDto,
  ) {
    return this.savedSearchesService.createForEmployer(user, dto);
  }

  @Delete('employer/:savedSearchId')
  deleteForEmployer(
    @CurrentUser() user: AuthUser,
    @Param('savedSearchId') savedSearchId: string,
  ) {
    return this.savedSearchesService.deleteForEmployer(user.id, savedSearchId);
  }
}
