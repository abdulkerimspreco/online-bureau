import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CvModule } from '../cv/cv.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CvReviewController } from './cv-review.controller';
import { CvReviewService } from './cv-review.service';
import { CV_REVIEW_PROVIDER } from './cv-review.types';
import { OpenAiCvReviewAdapter } from './openai-cv-review.adapter';

@Module({
  imports: [PrismaModule, CvModule, ConfigModule],
  controllers: [CvReviewController],
  providers: [
    CvReviewService,
    OpenAiCvReviewAdapter,
    {
      provide: CV_REVIEW_PROVIDER,
      useExisting: OpenAiCvReviewAdapter,
    },
  ],
})
export class CvReviewModule {}
