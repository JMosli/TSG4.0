import { Module } from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { PrismaService } from '../helpers/prisma.service';
import { StatisticsController } from './statistics.controller';
import { RangeModule } from 'src/range/range.module';

@Module({
  providers: [StatisticsService, PrismaService],
  controllers: [StatisticsController],
  imports: [RangeModule],
})
export class StatisticsModule {}
