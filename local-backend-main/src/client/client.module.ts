import { Module } from '@nestjs/common';
import { PrismaService } from 'src/helpers/prisma.service';
import { KioskModule } from 'src/kiosk/kiosk.module';
import { RangeModule } from 'src/range/range.module';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  controllers: [ClientController],
  providers: [ClientService, PrismaService],
  exports: [ClientService],
  imports: [RangeModule, KioskModule],
})
export class ClientModule {}
