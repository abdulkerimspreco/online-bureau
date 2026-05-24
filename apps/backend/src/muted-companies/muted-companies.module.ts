import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MutedCompaniesController } from './muted-companies.controller';
import { MutedCompaniesService } from './muted-companies.service';

@Module({
  imports: [PrismaModule],
  controllers: [MutedCompaniesController],
  providers: [MutedCompaniesService],
  exports: [MutedCompaniesService],
})
export class MutedCompaniesModule {}
