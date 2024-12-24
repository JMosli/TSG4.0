import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { AppService } from './app.service';
import { VERSION } from './constants';
import { GlobalRequestGuard } from './global-server/signature-manager/global-server.guard';
import { SignerInterceptor } from './global-server/signature-manager/response-signer.interceptor';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/status')
  @UseGuards(GlobalRequestGuard)
  @UseInterceptors(SignerInterceptor)
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('/ping')
  ping() {
    return {
      version: VERSION,
      echo: 'tsg-ping',
      checker: process.env.RANGE_PING_CHECKER,
    };
  }
}
