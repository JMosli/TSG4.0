import { Injectable } from '@nestjs/common';
import { FfmpegCommand } from 'fluent-ffmpeg';
import { wait } from 'src/helpers/utils';

@Injectable()
export class LaneRecordingUtilsService {
  constructor(
  ) {}

  async killFfmpeg(videoProcessor: FfmpegCommand) {
    // Stopping all video processing tasks
    //@ts-expect-error
    videoProcessor.ffmpegProc.stdin.write('q');

    // Waiting for ffmpeg to write its latest bytes not to
    // invalidate metadata at the end of container.

    // I think matroska container must be fault-tolerant, so
    // there is no need to wait, but just in case we are doing it
    await wait(100);
    videoProcessor.kill('SIGTERM');
  }
}
