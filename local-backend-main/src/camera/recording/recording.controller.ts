import { OrGuard } from '@nest-lab/or-guard';
import {
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { GlobalRequestGuard } from 'src/global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from 'src/global-server/signature-manager/response-signer.interceptor';
import { UserGuard } from 'src/global-server/user-manager/user-request.guard';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';
import { UserContext } from 'src/helpers/types';
import { KioskRequestGuard } from 'src/kiosk/kiosk.guard';
import { Public } from '../../global-server/public.decorator';
import { User } from '../../global-server/user-manager/user.decorator';
import { GetAllRecordingsDto } from './dto/get-all.dto';
import { RecordingService } from './recording.service';
import { VideoService } from './video.service';

@Controller('camera/recording')
@UseInterceptors(SignerInterceptor)
export class RecordingController {
  constructor(
    private readonly recordingService: RecordingService,
    private readonly videoService: VideoService,
  ) {}

  /**
   * Returns all recording in the database
   */
  @Get('all')
  @MaxTake(20)
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  getAll(@Query() payload: GetAllRecordingsDto) {
    return this.videoService.find(
      {
        is_sold: payload.is_sold,
        manually_recorded: payload.manually_recorded,
        cameraId: payload.camera_id,
      },
      { take: payload.take, skip: payload.skip },
    );
  }

  /**
   * Retrieves a single recording from the database
   */
  @Get(':id')
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  getRecording(@Param('id') videoId: number) {
    return this.recordingService.getFullVideoData(videoId);
  }

  /**
   * Removes a video from the database
   */
  @Delete(':id')
  @UseGuards(GlobalRequestGuard, UserGuard)
  removeRecording(@Param('id') videoId: number) {
    return this.videoService.removeVideo({ id: videoId });
  }

  /**
   * Retrieves a frame for a single recording
   */
  @Get(':id/frame')
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  async getFrame(@Param('id') videoId: number, @Query('frame') frame: number) {
    return new StreamableFile(
      await this.recordingService.getFrame(videoId, frame),
      { type: 'image/jpeg' },
    );
  }

  /**
   * Streams a video file
   * @throws {InternalServerErrorException} if video file was not found in the filesystem
   */
  @Public()
  @Get(':id/video')
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  async getRecordingVideo(
    @Param('id') videoId: number,
    @User() user: UserContext | null,
    @Res({ passthrough: true }) res: Response,
  ) {
    const file = await this.recordingService.streamVideo(videoId, user);
    res.setHeader('Content-Type', 'video/webm'); // for some reason, mkv video plays back when mime type is set to webm
    return file;
  }

  /**
   * Returns if camera records at the time
   */
  @Get('recorder/status/:cameraId')
  @UseGuards(GlobalRequestGuard, UserGuard)
  getRecordingStatus(@Param('cameraId') cameraId: number) {
    return this.recordingService.getStatus(cameraId);
  }

  /**
   * Starts a recording for the specified camera.
   * Saved video will be marked as manually recorded
   */
  @Post('recorder/start/:cameraId')
  @UseGuards(GlobalRequestGuard, UserGuard)
  startRecording(@Param('cameraId') cameraId: number) {
    return this.recordingService.startRecording(cameraId);
  }

  /**
   * Stops a recording for the specified camera.
   * Returns a status after recording stop
   */
  @Post('recorder/stop/:cameraId')
  @UseGuards(GlobalRequestGuard, UserGuard)
  async stopRecording(@Param('cameraId') cameraId: number) {
    await this.recordingService.stopRecording(cameraId);
    return this.recordingService.getStatus(cameraId);
  }
}
