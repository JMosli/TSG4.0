import { Module } from '@nestjs/common';
import { ClientModule } from 'src/client/client.module';
import { PrismaService } from 'src/helpers/prisma.service';
import { RecordingModule } from '../recording/recording.module';
import { CameraLaneService } from './camera-lane.service';
import { EndLaneRecordingService } from './end-recording.service';
import { StartLaneRecordingService } from './start-recording.service';
import { LaneRecordingUtilsService } from './utils.service';

@Module({
  providers: [
    PrismaService,
    CameraLaneService,
    StartLaneRecordingService,
    EndLaneRecordingService,
    LaneRecordingUtilsService,
  ],
  exports: [CameraLaneService],
  imports: [RecordingModule, ClientModule],
})
export class LaneDetectionModule {}
