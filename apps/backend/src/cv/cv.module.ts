import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';

@Module({
  imports: [PrismaModule],
  controllers: [CvController],
  providers: [CvService]
})
export class CvModule {}
