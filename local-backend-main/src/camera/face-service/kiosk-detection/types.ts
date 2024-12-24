import { CameraContext } from 'src/camera/types';
import { WorkerEvent } from 'src/camera/utils/worker.types';
import { FaceDetectParams } from '../lane-detection/types';

export interface KioskFaceDetectParams extends FaceDetectParams {
  /** These are short to save characters (65535 max) */
  config: {
    liveModel: boolean;
    minFaceSize: [number, number];
    timeout: number;
    startFaces: number;
    maxNoFaces: number;
    scaleFactor: number;
    classifier: string
  };
}

export interface FaceKioskDetectDataEvent {
  imagesDirectory: string;
  camera: CameraContext;
}

export type DetectMessage =
  | WorkerEvent<'face_detect_kiosk.detected', FaceKioskDetectDataEvent>
  | WorkerEvent<'log', string>;
