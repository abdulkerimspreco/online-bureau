import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateShortlistFolderDto } from './dto/create-shortlist-folder.dto';
import { ShortlistService } from './shortlist.service';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

@Controller('shortlist')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
export class ShortlistController {
  constructor(private readonly shortlistService: ShortlistService) {}

  @Get('employer/me')
  listForEmployer(@CurrentUser() user: AuthUser) {
    return this.shortlistService.listForEmployer(user.id);
  }

  @Get('employer/folders')
  listFoldersForEmployer(@CurrentUser() user: AuthUser) {
    return this.shortlistService.listFoldersForEmployer(user.id);
  }

  @Post('employer/:candidateId')
  addForEmployer(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    return this.shortlistService.addForEmployer(user, candidateId);
  }

  @Post('employer/folders')
  createFolderForEmployer(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateShortlistFolderDto,
  ) {
    return this.shortlistService.createFolderForEmployer(user.id, dto.name);
  }

  @Post('employer/folders/:folderId/entries/:shortlistEntryId')
  addEntryToFolderForEmployer(
    @CurrentUser() user: AuthUser,
    @Param('folderId') folderId: string,
    @Param('shortlistEntryId') shortlistEntryId: string,
  ) {
    return this.shortlistService.addEntryToFolderForEmployer(
      user.id,
      folderId,
      shortlistEntryId,
    );
  }

  @Delete('employer/:shortlistEntryId')
  removeForEmployer(
    @CurrentUser() user: AuthUser,
    @Param('shortlistEntryId') shortlistEntryId: string,
  ) {
    return this.shortlistService.removeForEmployer(user.id, shortlistEntryId);
  }

  @Delete('employer/folders/:folderId')
  deleteFolderForEmployer(
    @CurrentUser() user: AuthUser,
    @Param('folderId') folderId: string,
  ) {
    return this.shortlistService.deleteFolderForEmployer(user.id, folderId);
  }

  @Delete('employer/folders/:folderId/entries/:shortlistEntryId')
  removeEntryFromFolderForEmployer(
    @CurrentUser() user: AuthUser,
    @Param('folderId') folderId: string,
    @Param('shortlistEntryId') shortlistEntryId: string,
  ) {
    return this.shortlistService.removeEntryFromFolderForEmployer(
      user.id,
      folderId,
      shortlistEntryId,
    );
  }
}
