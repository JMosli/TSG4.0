import { Injectable } from '@nestjs/common';
import { CameraCrudService } from './camera-crud.service';
import { CameraKioskService } from './kiosk-detection/camera-kiosk.service';
import { CameraLaneService } from './lane-detection/camera-lane.service';
import { CameraContext } from './types';

@Injectable()
export class CameraStreamService {
  /**
   * Contains information about active streaming cameras
   * Key is camera id
   */
  public streamingCameras: Map<number, { lane: boolean }> = new Map();

  constructor(
    private readonly laneService: CameraLaneService,
    private readonly kioskService: CameraKioskService,
    private readonly crudService: CameraCrudService,
  ) {}

  /**
   * Starts a stream for camera as lane detector.
   * Destroys previous stream if it was active
   */
  async startLaneStream(camera: CameraContext) {
    await this.destroyStream(camera);
    this.streamingCameras.set(camera.id, {
      lane: true,
    });
    // and marking camera as streaming
    await this.crudService.updateCamera(camera, { streaming: true });
    return this.laneService.createReceiver(camera, camera.stream_url);
  }

  /**
   * Destroys stream for camera as lane detector
   */
  private destroyLaneStream(camera: CameraContext) {
    return this.laneService.destroyReceiver(camera);
  }

  /**
   * Starts a stream for camera as kiosk detector.
   * Destroys previous stream if it was active
   */
  async startKioskStream(camera: CameraContext) {
    await this.destroyStream(camera);
    this.streamingCameras.set(camera.id, {
      lane: false,
    });
    // and marking camera as streaming
    await this.crudService.updateCamera(camera, { streaming: true });
    return this.kioskService.createReceiver(camera, camera.stream_url);
  }

  /**
   * Destroys kiosk detector stream
   */
  private destroyKioskStream(camera: CameraContext) {
    return this.kioskService.destroyReceiver(camera);
  }

  /**
   * Destroys any stream for the specific camera.
   * Automatically checks streaming type and removes
   * stream of that type
   */
  async destroyStream(camera: CameraContext) {
    const stream = this.streamingCameras.get(camera.id);
    if (!stream) return;

    if (stream.lane) await this.destroyLaneStream(camera);
    else this.destroyKioskStream(camera);

    this.streamingCameras.delete(camera.id);
  }
}
