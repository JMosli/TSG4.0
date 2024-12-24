import { OrGuard } from '@nest-lab/or-guard';
import {
  Body,
  Controller,
  Get,
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
import { KioskRequestGuard } from 'src/kiosk/kiosk.guard';
import { CameraCrudService } from './camera-crud.service';
import { CameraService } from './camera.service';
import { ConnectCameraDto } from './dto/connect-camera.dto';
import { CameraProbeService } from './probe.service';

@Controller('camera')
@UseInterceptors(SignerInterceptor)
export class CameraCommonController {
  constructor(
    private readonly cameraService: CameraService,
    private readonly probeService: CameraProbeService,
    private readonly crudService: CameraCrudService,
  ) {}

  /**
   * Returns all cameras registered in the database
   */
  @Get('all')
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  @MaxTake(50)
  async getAllCameras(@Query() pagination: PaginateDto) {
    return this.crudService.paginate({}, pagination);
  }

  /**
   * Probes a network to find cameras
   * Returns detected cameras
   */
  @Post('probe')
  @UseGuards(GlobalRequestGuard, UserGuard)
  async probe() {
    await this.probeService.probeCameras();
    return {
      fun_fact: 'Humans invented surgery long before they invented anesthesia.',
      fun_fact_2:
        'Brain aneurysms can happen to anyone, at any age and most are fatal.',
      fun_fact_3: 'Just google Stoneman syndrome',
      fun_fact_4:
        'Half of the population has below average intelligence. (I have 7 iq btw (its not a joke (im really not joking)))',
      fuck_fact_5:
        'Every time you drive over a bridge, know that the company that could build it cheapest got the job.',
      just_fucking_google: 'Locked In Syndrome',
      detected_cameras: [...this.probeService.detectedCameras].map(
        ([key, value]) => ({ ...value, key }),
      ),
    };
  }

  /**
   * Creates new camera
   */
  @Post('connect')
  @UseGuards(GlobalRequestGuard, UserGuard)
  connectCamera(@Body() payload: ConnectCameraDto) {
    return this.cameraService.connectCamera(payload);
  }
}
