import {
  All,
  BadGatewayException,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Request, Response } from 'express';
import send from 'send';
import { Public } from 'src/global-server/public.decorator';
import { GlobalRequestGuard } from 'src/global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from 'src/global-server/signature-manager/response-signer.interceptor';
import { UserGuard } from 'src/global-server/user-manager/user-request.guard';
import { AgentDVRService } from './agentdvr/agentdvr.service';
import { CameraCrudService } from './camera-crud.service';
import { CameraErrors } from './constants';

/**
 * Processes all webrtc-related requests for the specified camera.
 * Note: I am too lazy to move this into the webrtc module and I thunk
 * there is not actual necessity to do this just to keep all camera-related
 * requests in one module and not split controllers into different modules
 */
@Controller('camera')
@UseGuards(GlobalRequestGuard, UserGuard)
export class WebrtcController {
  constructor(
    private readonly crudService: CameraCrudService,
    private readonly agentdvrService: AgentDVRService,
  ) {}

  /**
   * Gets a agentdvr camera object
   */
  @Get(':id/webrtc/agentdvr/object')
  @UseInterceptors(SignerInterceptor)
  async getAgentdvrObject(@Param('id') cameraId: number) {
    const camera = await this.crudService.findOne({ id: cameraId });
    return this.agentdvrService.getCameraObject(camera);
  }

  /**
   * Gets an agentdvr camera stream
   */
  @Get(':id/webrtc/agentdvr/stream.mjpg')
  @Header('Content-Type', 'multipart/x-mixed-replace; boundary=myboundary')
  @Public()
  async getAgentdvrMjpgStream(
    @Param('id') cameraId: number,
    @Query('size') size?: string,
  ) {
    const camera = await this.crudService.findOne({ id: cameraId });
    const obj = await this.agentdvrService.getCameraObject(camera);
    if (!obj) throw new NotFoundException(CameraErrors.AgentDVRNotFound)

    const video = obj.filter((o) => 'name' in o && o.typeID == 2)[0];
    if (!video || !('name' in video)) throw new NotFoundException();

    if (!size) {
      size = `${video.data.mjpegStreamWidth}x${video.data.mjpegStreamHeight}`;
    }

    return this.agentdvrService.getMjpgStream(video.id, size);
  }

  /**
   * Provides an access to the agentdvr
   */
  @All('webrtc/agentdvr/*')
  @UseInterceptors(SignerInterceptor)
  @Public()
  async agentdvrProxy(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    send.mime.charsets.lookup = () => null;

    const agentResponse = await this.agentdvrService
      .proxy(request)
      .catch((err) => err);
    if (agentResponse.status >= 400) throw new BadGatewayException();

    response.setHeader(
      'Content-Type',
      agentResponse.headers['content-type']?.toString?.() ?? 'text/html',
    );

    return new StreamableFile(agentResponse.data);
  }
}
