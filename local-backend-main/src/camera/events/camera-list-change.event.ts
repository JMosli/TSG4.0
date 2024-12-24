import * as nodeOnvif from 'node-onvif-ts-extended';
import { OnvifCamera, OnvifCameraProbe } from '../types';

/**
 * Fires when new camera is added or removed
 */
export class CameraListChangeEvent {
  constructor(event: Partial<CameraListChangeEvent>) {
    Object.assign(this, event);
  }

  changed: {
    cam: OnvifCamera;
    connection: [OnvifCameraProbe, nodeOnvif.OnvifDevice];
  }[];
}
