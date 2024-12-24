import { Body, Controller, Post, Query, UseGuards } from '@nestjs/common';
import { CreateRangeDto } from 'src/range/dto/create-range.dto';
import { InitialKeyGuard } from './initial-key.guard';
import { SetupService } from './setup.service';

@Controller('setup')
@UseGuards(InitialKeyGuard)
export class SetupController {
  constructor(private readonly setupService: SetupService) {}

  @Post('config')
  setupConfig(@Query("reset") reset?: boolean) {
    return this.setupService.setupConfig(!!reset);
  }

  @Post('create_directories')
  createDirectories() {
    return this.setupService.createDirectories();
  }

  /**
   * This endpoint is used by global backend to setup new range entry with
   * the required keys for signing and checking requests.
   */
  @Post('range')
  async setupRange(@Body() payload: CreateRangeDto) {
    return await this.setupService.setupRange(payload);
  }
}
