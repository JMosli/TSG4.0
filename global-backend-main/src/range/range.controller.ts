import {
  All,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RangeService } from './range.service';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { AllowUnauthorized } from 'src/helpers/allow-unauthorized.decorator';
import { RangeErrors } from './constants';
import { UserContext } from 'src/auth/types';
import { User } from 'src/users/user.decorator';
import { RangeProxyService } from './range-proxy.service';

const restreaming = {
  '/:id/api/camera/recording/:recordingId/video': ({ recordingId }) =>
    `/camera/recording/${recordingId}/video`,
  '/:id/api/camera/:cameraId/webrtc/agentdvr/stream.mjpg': ({ cameraId }) =>
    `/camera/${cameraId}/webrtc/agentdvr/stream.mjpg`,
  '/:id/api/camera/webrtc/agentdvr/*': (_, request: Request) =>
    `/camera/webrtc/agentdvr/${request.url.match(/\/(\d+)\/api\/camera\/webrtc\/agentdvr\/(.+)/).at(2)}`,
};

@Controller('range')
export class RangeController {
  constructor(
    private readonly rangeService: RangeService,
    private readonly rangeProxyService: RangeProxyService,
  ) {}

  @All(Object.keys(restreaming))
  async getRecording(
    @Param() params: object,
    @Param('id') rangeId: number,
    @Req() request: Request,
    @Res({ passthrough: true }) resp: Response,
  ) {
    const route = request.route.path.replace('/v1/range', '');
    const range = await this.rangeService.findOne({ where: { id: rangeId } });
    if (!range) throw new NotFoundException(RangeErrors.RangeNotFound);

    const newUrl = restreaming[route](params, request);

    const { stream, response } = await this.rangeProxyService.restreamResponse(
      range,
      newUrl,
      request,
    );

    Object.entries(response.headers).forEach(([key, value]) =>
      resp.setHeader(key, value),
    );

    return stream;
  }

  /**
   * This endpoint is used to pass requests to the range.
   *
   * If you make `POST /range/1/api/path/to/endpoint`, then server would
   * sign a request and send data to the range in a way like
   * `POST /path/to/endpoint`.
   *
   * @throws {NotFoundException} if range was not found
   */
  @AllowUnauthorized()
  @UseGuards(AuthGuard)
  @All('/:id/api/*')
  async proxyToRange(
    @User() user: UserContext | null,
    @Req() req: Request,
    @Body() payload: any,
    @Param('id') rangeId: number,
  ) {
    const range = await this.rangeService.findOne({ where: { id: rangeId } });
    if (!range) throw new NotFoundException(RangeErrors.RangeNotFound);

    return this.rangeProxyService.proxyToRange(user, range, req, payload);
  }
}
