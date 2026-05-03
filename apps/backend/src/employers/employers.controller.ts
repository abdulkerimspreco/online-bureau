import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SearchCandidatesDto } from './dto/search-candidates.dto';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';
import { EmployersService } from './employers.service';

interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
}

@Controller('employers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.EMPLOYER)
export class EmployersController {
    constructor(private readonly employersService: EmployersService) { }

    @Get('getMyProfile')
    getMyProfile(@CurrentUser() user: AuthUser) {
        return this.employersService.getMyProfile(user.id);
    }

    @Get('search')
    searchCandidates(
        @CurrentUser() user: AuthUser,
        @Query() dto: SearchCandidatesDto,
    ) {
        return this.employersService.searchCandidates(user, dto);
    }

    @Patch('updateMyProfile')
    updateMyProfile(
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdateEmployerProfileDto,
    ) {
        return this.employersService.updateMyProfile(user.id, dto);
    }

}
