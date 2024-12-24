import { Global, Module } from '@nestjs/common';
import { PrismaService } from 'src/helpers/prisma.service';
import { KioskModule } from 'src/kiosk/kiosk.module';
import { RangeModule } from 'src/range/range.module';
import { ConfigController } from './config.controller';
import { ConfigService } from './config.service';

@Global()
@Module({
  controllers: [ConfigController],
  providers: [ConfigService, PrismaService],
  exports: [ConfigService],
  imports: [RangeModule, KioskModule],
})
export class ConfigModule {}
