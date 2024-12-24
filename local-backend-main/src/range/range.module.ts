import { Module } from '@nestjs/common';
import { RangeService } from './range.service';
import { RangeController } from './range.controller';
import { PrismaService } from 'src/helpers/prisma.service';

@Module({
  providers: [RangeService, PrismaService],
  controllers: [RangeController],
  exports: [RangeService],
})
export class RangeModule {}
