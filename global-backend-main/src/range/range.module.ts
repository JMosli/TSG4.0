import { Module } from '@nestjs/common';
import { RangeController } from './range.controller';
import { RangeService } from './range.service';
import { RangeAdminController } from './admin.controller';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeProxyService } from './range-proxy.service';
import { WebrtcProxyGateway } from './webrtc-proxy.gateway';

@Module({
  controllers: [RangeController, RangeAdminController],
  providers: [
    RangeService,
    RangeProxyService,
    WebrtcProxyGateway,
    PrismaService,
  ],
  exports: [RangeService, RangeProxyService],
})
export class RangeModule {}
