import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PhotoService } from './photo.service';
import { PaymentService } from 'src/payment/payment.service';
import { RangeGuard } from 'src/range/signature-manager/range-request.guard';
import { RangeContext } from 'src/range/constants';
import { UploadPhotoDto } from './dto/upload-photo.dto';
import { Range } from 'src/range/range.decorator';
import { SignerInterceptor } from 'src/range/signature-manager/response-signer.interceptor';

@Controller('photo')
export class PhotoController {
  constructor(
    private readonly photoService: PhotoService,
    private readonly paymentService: PaymentService,
  ) {}

  @UseGuards(RangeGuard)
  @Post('upload')
  async uploadPhoto(
    @Range() range: RangeContext,
    @Body() body: UploadPhotoDto,
  ) {
    const payment = await this.paymentService.findOne({
      uid: body.payment_uid,
      range: {
        id: range.id,
      },
    });
    return this.photoService.uploadPhoto(
      range,
      payment,
      Buffer.from(body.photo, 'base64'),
    );
  }

  /**
   * Returns some random bought videos for a tv
   */
  @Get('preview_bought')
  @UseInterceptors(SignerInterceptor)
  @UseGuards(RangeGuard)
  listBoughtVideos() {
    return this.photoService
      .getRandomPhotos(20)
      .then((r) => r.map((v) => v.uid));
  }

  @Get(':uid/photo')
  getPhotoFile(
    @Param('uid') uid: string,
    @Query('download') download?: boolean,
  ) {
    return this.photoService.streamFile(uid, download);
  }
}
