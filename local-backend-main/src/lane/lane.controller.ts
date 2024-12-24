import {
  Controller,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GlobalRequestGuard } from 'src/global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from 'src/global-server/signature-manager/response-signer.interceptor';
import { UserGuard } from 'src/global-server/user-manager/user-request.guard';
import { LaneService } from './lane.service';

@Controller('lane')
export class LaneController {
  constructor(private readonly laneService: LaneService) {}

  /**
   * Starts face detection job for lane
   */
  @UseInterceptors(SignerInterceptor)
  @UseGuards(GlobalRequestGuard, UserGuard)
  @Post(':laneName/attach_camera/:cameraId')
  attachCamera(
    @Param('laneName') laneName: string,
    @Param('cameraId') cameraId: number,
  ) {
    return this.laneService.attachCamera(laneName, cameraId);
  }

  /**
   * Destroys face detection job
   */
  @UseInterceptors(SignerInterceptor)
  @UseGuards(GlobalRequestGuard, UserGuard)
  @Post(':laneName/detach_camera/:cameraId')
  detachCamera(
    @Param('laneName') laneName: string,
    @Param('cameraId') cameraId: number,
  ) {
    return this.laneService.detachCamera(laneName, cameraId);
  }
}
