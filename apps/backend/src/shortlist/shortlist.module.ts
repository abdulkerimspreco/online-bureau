import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ShortlistController } from './shortlist.controller';
import { ShortlistService } from './shortlist.service';

@Module({
  imports: [PrismaModule],
  controllers: [ShortlistController],
  providers: [ShortlistService],
})
export class ShortlistModule {}
