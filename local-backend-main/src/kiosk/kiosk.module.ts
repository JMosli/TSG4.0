import { Module } from '@nestjs/common';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeModule } from 'src/range/range.module';
import { KioskController } from './kiosk.controller';
import { KioskService } from './kiosk.service';
import { KioskLoggingController } from './logging.controller';
import { TvController } from './tv.controller';

@Module({
  controllers: [KioskController, KioskLoggingController, TvController],
  providers: [KioskService, PrismaService],
  exports: [KioskService],
  imports: [RangeModule],
})
export class KioskModule {}
