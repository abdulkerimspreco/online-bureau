import {
    Body,
    Controller,
    Delete,
    Get,
    Post,
    Req,
    UseGuards,
    Param
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('tags')
export class TagsController {
    constructor(private readonly tagsService: TagsService) { }

    @Get()
    getAll() {
        return this.tagsService.getAllTags();
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMyTags(@Req() req: any) {
        return this.tagsService.getMyTags(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('me')
    attachTag(
        @Req() req: any,
        @Body() body: { tagId: string },
    ) {
        return this.tagsService.attachTag(req.user.id, body.tagId);
    }

    @UseGuards(JwtAuthGuard)
    @Delete('me/:tagId')
    removeTag(@Req() req: any, @Param('tagId') tagId: string) {
        return this.tagsService.removeTag(req.user.id, tagId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post()
    createTag(@Body() body: { name: string }) {
        return this.tagsService.createTag(body.name);
    }
}
