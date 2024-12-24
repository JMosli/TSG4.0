import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GlobalRequestGuard } from 'src/global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from 'src/global-server/signature-manager/response-signer.interceptor';
import { UserGuard } from 'src/global-server/user-manager/user-request.guard';
import { CameraCrudService } from './camera-crud.service';
import { CameraService } from './camera.service';
import { UpdateConfigDto } from './dto/update-config.dto';
import { UpdateStreamUrlDto } from './dto/update-stream-url.dto';
import { OnvifService } from './onvif.service';

@Controller('camera/:id')
@UseInterceptors(SignerInterceptor)
@UseGuards(GlobalRequestGuard, UserGuard)
export class CameraController {
  constructor(
    private readonly crudService: CameraCrudService,
    private readonly cameraService: CameraService,
    private readonly onvifService: OnvifService,
  ) {}

  /**
   * Retrieves one camera by its id
   */
  @Get()
  getCamera(@Param('id') cameraId: number) {
    return this.crudService.findOne({ id: cameraId });
  }

  /**
   * Returns a list of onvif profiles for the camera
   */
  @Get('onvif/profiles')
  getOnvifProfiles(@Param('id') cameraId: number) {
    return this.onvifService.getProfiles(cameraId);
  }

  /**
   * Returns real time stream info
   */
  @Get('stream_info')
  getStreamInfo(@Param('id') cameraId: number) {
    return this.cameraService.getStreamInfo(cameraId);
  }

  /**
   * Updates the specified keys in the camera config
   */
  @Post('update_config')
  async updateConfig(
    @Param('id') cameraId: number,
    @Body() payload: UpdateConfigDto,
  ) {
    return this.cameraService.updateConfig(cameraId, payload);
  }

  /**
   * Assigns new stream url to the camera
   */
  @Post('update_stream_url')
  async updateStreamUrl(
    @Param('id') cameraId: number,
    @Body() payload: UpdateStreamUrlDto,
  ) {
    const camera = await this.crudService.findOne({ id: cameraId });
    return this.cameraService.updateStreamURL(camera, payload.stream_url);
  }

  /**
   * Disconnects a camera from any stream (face detector)
   */
  @Post('disable')
  disableCamera(@Param('id') cameraId: number) {
    return this.cameraService.disableCamera(cameraId);
  }

  /**
   * Stops and starts camera stream.
   * Can be used to apply config changes to stream.
   */
  @Post('restart_stream')
  restartStream(@Param('id') cameraId: number) {
    return this.cameraService.restartCameraStream(cameraId);
  }

  /**
   * Removes a camera from the database
   */
  @Delete()
  removeCamera(@Param('id') cameraId: number) {
    return this.cameraService.removeCamera(cameraId);
  }
}
