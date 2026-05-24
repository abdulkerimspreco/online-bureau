import { Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminUsersService } from './admin-users.service';
import { ListAdminUsersDto } from './dto/list-admin-users.dto';

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  listUsers(@Query() dto: ListAdminUsersDto) {
    return this.adminUsersService.listUsers(dto);
  }

  @Patch(':userId/deactivate')
  deactivateUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    return this.adminUsersService.deactivateUser(user.id, userId);
  }

  @Patch(':userId/reactivate')
  reactivateUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    return this.adminUsersService.reactivateUser(user.id, userId);
  }

  @Delete(':userId')
  deleteUser(
    @CurrentUser() user: AuthUser,
    @Param('userId') userId: string,
  ) {
    return this.adminUsersService.deleteUser(user.id, userId);
  }
}
