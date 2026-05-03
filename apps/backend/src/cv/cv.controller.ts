import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateCvVisibilityDto } from './dto/update-cv-visibility.dto';
import { cvFileFilter, cvStorage } from './cv.storage';
import { CvService } from './cv.service';

interface AuthUser {
    id: string;
    email: string;
    role: UserRole;
    isVerified: boolean;
}

@Controller('cv')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.JOB_SEEKER)
export class CvController {
    constructor(private readonly cvService: CvService) { }

    @Get('me')
    getMyCv(@CurrentUser() user: AuthUser) {
        return this.cvService.getMyCv(user.id);
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: cvStorage,
            fileFilter: cvFileFilter,
            limits: {
                fileSize: 10 * 1024 * 1024,
            },
        }),
    )
    uploadCv(
        @CurrentUser() user: AuthUser,
        @UploadedFile() file: Express.Multer.File,
    ) {
        return this.cvService.uploadCv(user.id, file);
    }

    @Patch('visibility')
    updateVisibility(
        @CurrentUser() user: AuthUser,
        @Body() dto: UpdateCvVisibilityDto,
    ) {
        return this.cvService.updateVisibility(user.id, dto.visibility);
    }

    @Delete('me')
    deleteMyCv(@CurrentUser() user: AuthUser) {
        return this.cvService.deleteMyCv(user.id);
    }
}
