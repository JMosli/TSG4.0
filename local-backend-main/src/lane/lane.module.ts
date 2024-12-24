import { Module } from '@nestjs/common';
import { CameraModule } from 'src/camera/camera.module';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeModule } from 'src/range/range.module';
import { LaneController } from './lane.controller';
import { LaneService } from './lane.service';

@Module({
  controllers: [LaneController],
  providers: [LaneService, PrismaService],
  imports: [CameraModule, RangeModule],
})
export class LaneModule {}
