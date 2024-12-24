import { OrGuard } from '@nest-lab/or-guard';
import {
  Controller,
  Delete,
  Get,
  Param,
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
import { ClientService } from './client.service';
import { GetMediaTokenDto } from './dto/get-token.dto';

@Controller('client')
@UseInterceptors(SignerInterceptor)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  /**
   * Used by admin to get all clients that were not deleted and
   * were in lanes
   */
  @Get('all')
  @MaxTake(20)
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  getAllClients(@Query() pagination: PaginateDto) {
    return this.clientService.find(
      {},
      { skip: pagination.skip, take: pagination.take },
    );
  }

  @Get(':id/media_token')
  @UseGuards(KioskRequestGuard)
  async getMediaToken(
    @Query() payload: GetMediaTokenDto,
    @Param('id') clientId: number,
  ) {
    return this.clientService.getMediaToken(
      clientId,
      payload.video_id,
      payload.frame,
    );
  }

  /**
   * Retrieves one specified client
   */
  @Get(':id')
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  getClient(@Param('id') clientId: number) {
    return this.clientService.findOne({ id: clientId });
  }

  /**
   * Removes all data associated with the specified client
   */
  @Delete(':id')
  @UseGuards(GlobalRequestGuard, UserGuard)
  removeClient(@Param('id') clientId: number) {
    return this.clientService.removeClient(clientId);
  }
}
