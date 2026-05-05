import {
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

  @Post('employer/:candidateId')
  addForEmployer(
    @CurrentUser() user: AuthUser,
    @Param('candidateId') candidateId: string,
  ) {
    return this.shortlistService.addForEmployer(user, candidateId);
  }

  @Delete('employer/:shortlistEntryId')
  removeForEmployer(
    @CurrentUser() user: AuthUser,
    @Param('shortlistEntryId') shortlistEntryId: string,
  ) {
    return this.shortlistService.removeForEmployer(user.id, shortlistEntryId);
  }
}
