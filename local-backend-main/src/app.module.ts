import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CameraModule } from './camera/camera.module';
import { KioskDetectionModule } from './camera/kiosk-detection/kiosk-detection.module';
import { LaneDetectionModule } from './camera/lane-detection/lane-detection.module';
import { ConfigModule } from './config/config.module';
import { CryptoModule } from './crypto/crypto.module';
import { GlobalServerModule } from './global-server/global-server.module';
import { KioskModule } from './kiosk/kiosk.module';
import { LaneModule } from './lane/lane.module';
import { PaymentModule } from './payment/payment.module';
import { RangeModule } from './range/range.module';
import { SetupModule } from './setup/setup.module';

import '@tensorflow/tfjs-node';
import { RecordingModule } from './camera/recording/recording.module';
import { ClientModule } from './client/client.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    SetupModule,
    RangeModule,
    CryptoModule,
    GlobalServerModule,
    CameraModule,
    KioskModule,
    LaneModule,
    PaymentModule,
    ConfigModule,
    LaneDetectionModule,
    KioskDetectionModule,
    RecordingModule,
    ClientModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
