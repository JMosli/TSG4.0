import { Controller, Get, UseGuards } from '@nestjs/common';
import { GlobalServerService } from 'src/global-server/global-server.service';
import { KioskRequestGuard } from './kiosk.guard';

@Controller('kiosk/tv')
export class TvController {
  constructor(private readonly globalServer: GlobalServerService) {}

  @Get('bought_media')
  @UseGuards(KioskRequestGuard)
  async getBoughtMedia() {
    const videos = await this.globalServer.communicator.video
      .getBoughtVideos()
      .then((res) => res.ok());
    const photos = await this.globalServer.communicator.photo
      .getBoughtPhotos()
      .then((res) => res.ok());

    return { videos, photos };
  }
}
