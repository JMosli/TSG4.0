import {
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RangeGuard } from 'src/range/signature-manager/range-request.guard';
import { SignerInterceptor } from 'src/range/signature-manager/response-signer.interceptor';
import { VideoService } from './video.service';
import { Range } from 'src/range/range.decorator';
import { RangeContext } from 'src/range/constants';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { setupSettings } from 'src/setup/constants';
import { UploadVideoDto } from './dto/upload-video.dto';
import { PaymentService } from 'src/payment/payment.service';

@Controller('video')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * This endpoint is used by local server to upload sold videos to the server.
   * It returns created file that can be given to the user to allow him to watch his video.
   */
  @UseInterceptors(
    SignerInterceptor,
    FileInterceptor('video', {
      storage: diskStorage({
        destination: setupSettings.TEMP_PATH,
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${crypto.randomUUID()}-${file.originalname}`);
        },
      }),
    }),
  )
  @UseGuards(RangeGuard)
  @Post('upload')
  async uploadVideo(
    @Range() range: RangeContext,
    @UploadedFile() file: Express.Multer.File,
    @Query() payload: UploadVideoDto,
  ) {
    const payment = await this.paymentService.findOne({
      uid: payload.payment_uid,
      range: {
        id: range.id,
      },
    });

    return this.videoService.uploadVideo(
      range,
      payment,
      file,
      payload.local_id,
    );
  }

  /**
   * Returns some random bought videos for a tv
   */
  @Get('preview_bought')
  @UseInterceptors(SignerInterceptor)
  @UseGuards(RangeGuard)
  listBoughtVideos() {
    return this.videoService
      .getRandomVideos(20)
      .then((r) => r.map((v) => v.uid));
  }

  @Get(':uid/video')
  @Header('Content-Type', 'video/mp4')
  getVideoFile(
    @Param('uid') uid: string,
    @Query('download') download?: boolean,
  ) {
    return this.videoService.streamFile(uid, download);
  }

  /**
   * Finds one specific video
   */
  @Get(':uid')
  findVideo(@Param('uid') uid: string) {
    return this.videoService.findVideo({ uid });
  }
}
