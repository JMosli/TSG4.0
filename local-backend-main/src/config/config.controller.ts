import { OrGuard } from '@nest-lab/or-guard';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { GlobalRequestGuard } from 'src/global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from 'src/global-server/signature-manager/response-signer.interceptor';
import { UserGuard } from 'src/global-server/user-manager/user-request.guard';
import { KioskRequestGuard } from 'src/kiosk/kiosk.guard';
import { ConfigService } from './config.service';
import { SetValueDto } from './dto/set.dto';

@Controller('config')
@UseInterceptors(SignerInterceptor)
export class ConfigController {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns if user needs to perform a reboot to apply configuration
   * changes
   */
  @Get('status')
  @UseGuards(GlobalRequestGuard, UserGuard)
  getStatus() {
    return {
      must_reboot: this.configService.waitingReboot,
    };
  }

  /**
   * Returns full config in json format
   */
  @Get('get_all')
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  getAll() {
    return this.configService.getAll();
  }

  /**
   * Gets one key from the config
   */
  @Get(':key')
  @UseGuards(OrGuard([KioskRequestGuard, GlobalRequestGuard]))
  get(@Param('key') key: string) {
    return this.configService.get(key, { throws: true, logError: false });
  }

  /**
   * Adds or updates a key in the config
   */
  @Patch(':key')
  @UseGuards(GlobalRequestGuard, UserGuard)
  set(@Param('key') key: string, @Body() value: SetValueDto) {
    try {
      return this.configService.set(key, JSON.parse(value.value), {
        mustReboot: value.must_reboot,
        system: false,
      });
    } catch (error) {
      throw new BadRequestException(error?.message ?? error);
    }
  }

  /**
   * Removes an entry from the database
   */
  @Delete(':key')
  @UseGuards(GlobalRequestGuard, UserGuard)
  remove(@Param('key') key: string) {
    return this.configService.remove(key);
  }
}
