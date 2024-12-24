import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { rmdir } from 'src/helpers/utils';
import { ConfigService } from '../../config/config.service';
import { FaceKioskDetectDataEvent } from '../face-service/kiosk-detection/types';
import { FaceRecognitionService } from '../face-service/recognition/recognition.service';
import { FaceRecognizeResult } from '../face-service/recognition/types';

@Injectable()
export class KioskStreamService {
  constructor(
    private readonly recognizerService: FaceRecognitionService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent('face_recognizer.recognize.finished')
  private async onFaceRecognized(payload: FaceRecognizeResult) {
    await rmdir(payload.facesDirectory);
    console.log(payload);
  }

  @OnEvent('face_detect_kiosk.detected')
  private async onFaceDetected(payload: FaceKioskDetectDataEvent) {
    const numFaces = (
      await this.configService.get<number>(
        'camera.recognition.faces_to_recognize',
      )
    ).value;

    await this.recognizerService.recognize({
      ...payload,
      config: { numFaces },
    });
  }
}
