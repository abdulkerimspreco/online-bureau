import {
    Body,
    Controller,
    Delete,
    Get,
    Patch,
    Post,
    Query,
    Req,
    UseGuards,
    Param
} from '@nestjs/common';
import { CustomTagRequestStatus, UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { CreateCustomTagRequestDto } from './dto/create-custom-tag-request.dto';
import { RejectCustomTagRequestDto } from './dto/reject-custom-tag-request.dto';

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
    @Roles(UserRole.JOB_SEEKER)
    @Get('requests/me')
    getMyCustomTagRequests(@Req() req: any) {
        return this.tagsService.getMyCustomTagRequests(req.user.id);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.JOB_SEEKER)
    @Post('requests')
    createCustomTagRequest(
      @Req() req: any,
      @Body() body: CreateCustomTagRequestDto,
    ) {
      return this.tagsService.createCustomTagRequest(req.user.id, body.name);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin')
    getAdminTags() {
        return this.tagsService.getAdminTags();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Get('admin/requests')
    getAdminCustomTagRequests(
      @Query('status') status?: CustomTagRequestStatus,
    ) {
      return this.tagsService.getAdminCustomTagRequests(status);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Post()
    createTag(@Body() body: CreateTagDto) {
        return this.tagsService.createTag(body.name);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch(':tagId')
    renameTag(@Param('tagId') tagId: string, @Body() body: UpdateTagDto) {
        return this.tagsService.renameTag(tagId, body.name);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Delete(':tagId')
    deleteTag(@Param('tagId') tagId: string) {
        return this.tagsService.deleteTag(tagId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch('admin/requests/:requestId/approve')
    approveCustomTagRequest(@Req() req: any, @Param('requestId') requestId: string) {
      return this.tagsService.approveCustomTagRequest(req.user.id, requestId);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @Patch('admin/requests/:requestId/reject')
    rejectCustomTagRequest(
      @Req() req: any,
      @Param('requestId') requestId: string,
      @Body() body: RejectCustomTagRequestDto,
    ) {
      return this.tagsService.rejectCustomTagRequest(req.user.id, requestId, body.note);
    }
}
