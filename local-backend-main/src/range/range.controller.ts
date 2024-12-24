import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GlobalRequestGuard } from 'src/global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from 'src/global-server/signature-manager/response-signer.interceptor';
import { OnlyGlobalAdmin } from 'src/global-server/user-manager/global-admin.decorator';
import { UserGuard } from 'src/global-server/user-manager/user-request.guard';
import { RangeErrors } from './constants';
import { RangeService } from './range.service';

@UseInterceptors(SignerInterceptor)
@Controller('range')
export class RangeController {
  private readonly logger = new Logger(RangeController.name);

  constructor(private readonly rangeService: RangeService) {}

  @UseGuards(GlobalRequestGuard)
  @Get('test')
  test() {
    return { hello: 'world' };
  }

  /**
   * This endpoint is used by global server to remove local range entry when
   * global admin removes it on global server side.
   *
   * We don't want to provide a way to break a system even to the range owner, so
   * only global admin can access this endpoint.
   */
  @UseGuards(GlobalRequestGuard, UserGuard)
  @OnlyGlobalAdmin()
  @Delete('remove')
  async removeRange(@Body() payload: { range_id: number }) {
    this.logger.warn('removing default range');
    if (!payload.range_id)
      throw new BadRequestException(RangeErrors.RemoveFailed);

    const defaultRange = await this.rangeService.getDefault();
    if (defaultRange.global_id !== payload.range_id)
      throw new ForbiddenException(RangeErrors.IdNotEqual);

    return this.rangeService.removeRange(defaultRange);
  }
}
