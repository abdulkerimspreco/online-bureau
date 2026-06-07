import { Module } from '@nestjs/common';
import { CvModule } from '../cv/cv.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminCvModerationController } from './admin-cv-moderation.controller';
import { AdminCvModerationService } from './admin-cv-moderation.service';
import { CvModerationController } from './cv-moderation.controller';

@Module({
  imports: [PrismaModule, NotificationsModule, CvModule],
  controllers: [AdminCvModerationController, CvModerationController],
  providers: [AdminCvModerationService],
})
export class AdminCvModerationModule {}
