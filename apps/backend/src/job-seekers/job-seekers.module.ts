import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { JobSeekersController } from './job-seekers.controller';
import { JobSeekersService } from './job-seekers.service';

@Module({
  imports: [PrismaModule],
  controllers: [JobSeekersController],
  providers: [JobSeekersService],
})
export class JobSeekersModule {}
