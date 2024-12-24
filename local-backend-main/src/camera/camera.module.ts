import { Global, Module } from '@nestjs/common';
import { ClientModule } from 'src/client/client.module';
import { GlobalServerModule } from 'src/global-server/global-server.module';
import { PrismaService } from 'src/helpers/prisma.service';
import { KioskModule } from 'src/kiosk/kiosk.module';
import { RangeModule } from 'src/range/range.module';
import { AgentDVRModule } from './agentdvr/agentdvr.module';
import { AgentDVRService } from './agentdvr/agentdvr.service';
import { CameraCrudService } from './camera-crud.service';
import { CameraEventService } from './camera-event.service';
import { CameraScheduleService } from './camera-schedule.service';
import { WebrtcController } from './camera-webrtc.controller';
import { CameraController } from './camera.controller';
import { CameraService } from './camera.service';
import { CameraCommonController } from './common.controller';
import { CameraSocketGateway } from './event.gateway';
import { KioskFaceDetectService } from './face-service/kiosk-detection/detection.service';
import { LaneFaceDetectService } from './face-service/lane-detection/detection.service';
import { FaceRecognitionService } from './face-service/recognition/recognition.service';
import { KioskDetectionModule } from './kiosk-detection/kiosk-detection.module';
import { LaneDetectionModule } from './lane-detection/lane-detection.module';
import { OnvifService } from './onvif.service';
import { CameraProbeService } from './probe.service';
import { CameraStreamService } from './stream.service';

// this is fucking large
@Global()
@Module({
  controllers: [CameraCommonController, CameraController, WebrtcController],
  providers: [
    CameraService,
    CameraCrudService,
    CameraProbeService,
    OnvifService,
    CameraEventService,
    CameraScheduleService,
    LaneFaceDetectService,
    KioskFaceDetectService,
    FaceRecognitionService,
    CameraStreamService,
    CameraSocketGateway,
    PrismaService,
    AgentDVRService,
  ],
  exports: [
    CameraCrudService,
    OnvifService,
    CameraStreamService,
    CameraProbeService,
    FaceRecognitionService,
    LaneFaceDetectService,
    KioskFaceDetectService,
  ],
  imports: [
    RangeModule,
    LaneDetectionModule,
    KioskDetectionModule,
    ClientModule,
    KioskModule,
    AgentDVRModule,
    GlobalServerModule,
  ],
})
export class CameraModule {}
