import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GlobalRequestGuard } from 'src/global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from 'src/global-server/signature-manager/response-signer.interceptor';
import { UserGuard } from 'src/global-server/user-manager/user-request.guard';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';
import { PaginateDto } from 'src/helpers/paginate/types';
import { KioskService } from './kiosk.service';

@UseInterceptors(SignerInterceptor)
@UseGuards(GlobalRequestGuard, UserGuard)
@Controller('kiosk')
export class KioskController {
  constructor(private readonly kioskService: KioskService) {}

  /**
   * Returns a list of kiosks
   */
  @Get('all')
  @MaxTake(20)
  getAllKiosks(@Query() pagination: PaginateDto) {
    return this.kioskService.paginate({}, pagination);
  }

  /**
   * Finds one kiosk in the database by its id
   */
  @Get(':id')
  getKiosk(@Param('id') kioskId: number) {
    return this.kioskService.findOne({ id: kioskId });
  }

  /**
   * Returns some analytics parameters for the specified kiosk
   */
  @Get(':id/analytics')
  getAnalytics(@Param('id') kioskId: number) {
    return this.kioskService.analytics(kioskId);
  }

  /**
   * Used by RO to create kiosk in the system and then
   * use this kiosk to attach camera to it
   */
  @Post('create_kiosk')
  createKiosk() {
    return this.kioskService.createKiosk();
  }

  /**
   * Removes a specified kiosk
   */
  @Delete(':id')
  removeKiosk(@Param('id') kioskId: number) {
    return this.kioskService.removeKiosk({ id: kioskId });
  }

  /**
   * Used by RO to attach camera to the kiosk and
   * start detection stream
   */
  @Post('/:kioskId/attach_camera/:cameraId')
  attachCamera(
    @Param('kioskId') kioskId: number,
    @Param('cameraId') cameraId: number,
  ) {
    return this.kioskService.attachCamera(kioskId, cameraId);
  }

  /**
   * Used by RO to disconnect a camera from kiosk and
   * stop face detection job
   */
  @Post('/:kioskId/detach_camera/:cameraId')
  detachCamera(
    @Param('kioskId') kioskId: number,
    @Param('cameraId') cameraId: number,
  ) {
    return this.kioskService.detachCamera(kioskId, cameraId);
  }
}
