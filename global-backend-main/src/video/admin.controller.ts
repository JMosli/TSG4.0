import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VideoService } from './video.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { GlobalAdminGuard } from 'src/auth/guards/global-admin.guard';
import { MaxTake } from 'src/helpers/paginate/max-take.decorator';
import { GetVideosDto } from './dto/get-videos.dto';

@Controller('video/admin')
export class VideoAdminController {
  constructor(private readonly videoService: VideoService) {}

  /**
   * Gets all videos from the database
   */
  @MaxTake(100)
  @UseGuards(AuthGuard, GlobalAdminGuard)
  @Get('all')
  async findVideos(@Query() pagination: GetVideosDto) {
    const [count, items] = await this.videoService.findVideos(
      undefined,
      pagination,
    );

    return { count, items };
  }

  /**
   * Removes video from the database and from the filesystem.
   */
  @UseGuards(AuthGuard, GlobalAdminGuard)
  @Delete(':id')
  deleteVideo(@Param('id') videoId: number) {
    return this.videoService.deleteVideo(videoId);
  }
}
