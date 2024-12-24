import { Injectable, Logger } from '@nestjs/common';
import * as WorkerEngine from 'shinobi-worker';
import { ConfigService } from 'src/config/config.service';
import { KioskFaceDetectService } from '../face-service/kiosk-detection/detection.service';
import { CameraContext, Size } from '../types';

@Injectable()
export class CameraKioskService {
  private readonly logger = new Logger(CameraKioskService.name);

  /**
   * A map of running detection jobs.
   * A key is camera id.
   */
  public readonly detections: Map<number, WorkerEngine.Worker> = new Map();

  constructor(
    private readonly detectionService: KioskFaceDetectService,
    private readonly configService: ConfigService,
  ) {
    this.logger.debug('initialized kiosk stream service');
  }

  async createReceiver(camera: CameraContext, streamURI: string) {
    const c = this.configService;
    const get = <V>(key: string) => c.get<V>(key, { throws: true, logError: true })

    const minFaceSize = await get<Size>('camera.detection.min_face_size');
    //prettier-ignore
    const useLiveModel = await get<boolean>('camera.detection.use_live_model_detection');

    const worker = this.detectionService.startDetection({
      camera,
      streamURI,
      //prettier-ignore
      config: {
        maxNoFaces: (await get<number>("camera.detection.kiosk.max_frames_without_faces")).value,
        startFaces: (await get<number>('camera.detection.kiosk.min_start_faces')).value,
        timeout: (await get<number>('camera.detection.kiosk.session_timeout')).value,
        scaleFactor: (await get<number>('camera.detection.multiscale_scale_factor')).value,
        classifier: (await get<string>('camera.detection.kiosk.classifier')).value,
        liveModel: useLiveModel.value,
        minFaceSize: [minFaceSize.value.width, minFaceSize.value.height],
      },
    });

    this.detections.set(camera.id, worker);
  }

  destroyReceiver(camera: CameraContext) {
    const worker = this.detections.get(camera.id);
    if (!worker) return null;

    worker.kill('SIGTERM');
  }
}
