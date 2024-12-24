import { Client } from '@prisma/client';
import { FaceDetectDataEvent } from 'src/camera/events/face-detect-start.event';
import { CameraContext } from 'src/camera/types';
import { WorkerEvent } from 'src/camera/utils/worker.types';

export type StartMessage = {
  streamURL: string;
};

export type FrameMessage = WorkerEvent<
  'frame',
  { frame: Buffer; rows: number; cols: number; type: number }
>;

export interface FaceDetectParams {
  streamURI: string;
  camera: CameraContext;
}

export interface LaneFaceDetectParams extends FaceDetectParams {
  config: {
    liveModel: boolean;
    minFaceSize: [number, number];
    startFaces: number;
    maxNoFaces: number;
    minFaces: number;
    scaleFactor: number;
    classifier: string
  };
}

export type FaceDetectHostEvent = WorkerEvent<
  'client',
  {
    client: Client;
    saveFacesTo: string;
  }
>;

export type DetectMessage =
  | WorkerEvent<
      'face_detect.finished' | 'face_detect.start',
      FaceDetectDataEvent
    >
  | WorkerEvent<'log', string>;
