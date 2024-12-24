import { Module } from '@nestjs/common';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeModule } from '../range/range.module';
import { SetupController } from './setup.controller';
import { SetupService } from './setup.service';

@Module({
  controllers: [SetupController],
  providers: [SetupService, PrismaService],
  imports: [RangeModule],
})
export class SetupModule {}
