import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CvModule } from '../cv/cv.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CvReviewController } from './cv-review.controller';
import { CvReviewService } from './cv-review.service';

@Module({
  imports: [PrismaModule, CvModule, ConfigModule],
  controllers: [CvReviewController],
  providers: [CvReviewService],
})
export class CvReviewModule {}
