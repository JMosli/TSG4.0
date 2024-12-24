import { Client } from '@prisma/client';
import { CameraContext } from 'src/camera/types';
import {
  WorkerEvent,
  WorkerMessage,
  WorkerStart,
} from 'src/camera/utils/worker.types';

export type Matcher = number[][];

// Train types

export interface FaceTrainParams {
  client: Client;
  faceDirectory: string;
  saveMatcherTo: string;
}

export interface FaceTrainResult {
  matched: number;
}

export type FaceTrainEvent = WorkerEvent<
  'face_recognizer.train.finished',
  FaceTrainResult
>;

// Recognition types

export interface FaceRecognizeParams {
  imagesDirectory: string;
  camera: CameraContext;
  config: {
    numFaces: number;
  };
}

export interface FaceRecognizeResult {
  similarity: {
    index: number;
    distance: number;
    similarity: number;
  };
  client: Client;
  processId: number;
  facesDirectory: string;
}

export interface NotDetectedResult {
  not_detected: true;
  processId: number;
  errored?: boolean;
}

export type FaceRecognizeEvent =
  | WorkerEvent<'face_recognizer.recognize.finished', FaceRecognizeResult>
  | WorkerEvent<'face_recognizer.recognize.not_detected', NotDetectedResult>;

export type RecognitionEvent = WorkerEvent<
  'face_recognizer.start_worker',
  RecognizeClientParams
>;

// Recognize client types

export interface RecognizeClientParams {
  client: Client;
  facePath: string;
  matcherPath: string;
  processId: number;
  config: {
    similarity: number;
    numFaces: number;
  };
}

export type RecognizeClientMessage =
  | WorkerStart<{}>
  | WorkerMessage<'recognize', RecognizeClientParams>;
