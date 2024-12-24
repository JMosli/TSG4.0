import { Module } from '@nestjs/common';
import { ClientModule } from 'src/client/client.module';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeModule } from 'src/range/range.module';
import { RecordingController } from './recording.controller';
import { RecordingService } from './recording.service';
import { VideoService } from './video.service';

@Module({
  controllers: [RecordingController],
  providers: [RecordingService, VideoService, PrismaService],
  exports: [RecordingService, VideoService],
  imports: [RangeModule, ClientModule],
})
export class RecordingModule {}
