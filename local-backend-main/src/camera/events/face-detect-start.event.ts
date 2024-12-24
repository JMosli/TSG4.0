import { CameraContext } from '../types';

export type PlainRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export class FaceDetectDataEvent {
  constructor(event: FaceDetectDataEvent) {
    Object.assign(this, event);
  }

  numFaces: number;
  gotFaces: boolean;
  camera: CameraContext;
}
