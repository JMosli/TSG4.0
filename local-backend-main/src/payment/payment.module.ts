import { Module } from '@nestjs/common';
import { RecordingModule } from 'src/camera/recording/recording.module';
import { ClientModule } from 'src/client/client.module';
import { ClientService } from 'src/client/client.service';
import { PrismaService } from 'src/helpers/prisma.service';
import { KioskModule } from 'src/kiosk/kiosk.module';
import { KioskService } from 'src/kiosk/kiosk.service';
import { RangeModule } from 'src/range/range.module';
import { PaymentSocketGateway } from './event.gateway';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentTerminalController } from './terminal.controller';
import { PaymentTerminalService } from './terminal.service';

@Module({
  controllers: [PaymentController, PaymentTerminalController],
  providers: [
    PaymentService,
    PaymentTerminalService,
    PaymentSocketGateway,
    ClientService,
    PrismaService,
    KioskService,
  ],
  imports: [
    RangeModule,
    KioskModule,
    RecordingModule,
    ClientModule,
    KioskModule,
  ],
})
export class PaymentModule {}
