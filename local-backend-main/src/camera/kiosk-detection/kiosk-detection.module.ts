import { Module } from '@nestjs/common';
import { CameraKioskService } from './camera-kiosk.service';
import { KioskStreamService } from './on-detect.service';

@Module({
  providers: [CameraKioskService, KioskStreamService],
  exports: [CameraKioskService, KioskStreamService],
})
export class KioskDetectionModule {}
