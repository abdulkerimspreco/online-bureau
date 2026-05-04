import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmployersController } from './employers.controller';
import { EmployersService } from './employers.service';

@Module({
  imports: [PrismaModule],
  controllers: [EmployersController],
  providers: [EmployersService],
})
export class EmployersModule {}
