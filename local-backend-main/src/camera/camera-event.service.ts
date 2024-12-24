import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { RangeService } from 'src/range/range.service';
import { CameraCrudService } from './camera-crud.service';
import { CameraService } from './camera.service';
import { CameraListChangeEvent } from './events/camera-list-change.event';
import { OnvifService } from './onvif.service';
import { CameraContext } from './types';

/**
 * Processes add/remove/etc camera events
 */
@Injectable()
export class CameraEventService {
  private readonly logger = new Logger(CameraEventService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private readonly cameraCrudService: CameraCrudService,
    private readonly onvifService: OnvifService,
    private readonly rangeService: RangeService,
    private readonly cameraService: CameraService,
  ) {}

  /**
   * When camera is added to the system, this event fires
   */
  @OnEvent('camera.added')
  async cameraAdded(event: CameraListChangeEvent) {
    const range = await this.rangeService.getDefault();
    if (!range) return;

    const cameras = await Promise.all(
      event.changed.map(async ({ cam, connection }) => {
        // We dont need to add camera if its already in the database.
        const camera: CameraContext | null = await this.cameraCrudService
          .findOne({
            ip_address: cam.ip,
            port: cam.port,
          })
          .catch(() => null);

        // Setup newly connected camera
        const cameraInfo = await this.onvifService.setupCamera(
          camera,
          connection,
        );

        if (camera) {
          // If camera was disconnected earlier, we dont need to add it again,
          // just mark it as connected
          if (!camera.connected)
            await this.cameraCrudService.updateCamera(camera, {
              connected: true,
            });

          return camera;
        }

        // So if this is actually a new camera,
        // we need to add it to the database and already
        // connected and streaming
        const newCamera = await this.cameraCrudService.createCamera({
          stream_url: cameraInfo.stream,
          ip_address: cam.ip,
          port: cam.port,
          username: cam.username,
          password: cam.password,
          streaming: false,
          connected: true,
          kiosk_id: cam.metadata?.kioskId ?? null,
          lane_name: null,
          config: {
            fps: cameraInfo.profile?.video?.encoder?.framerate,
          },
        });

        this.onvifService.devices.set(newCamera.id, connection);
        await this.onvifService.setupAgentdvr(newCamera);
        await this.onvifService.setupCameraTexts(newCamera.id)

        return newCamera;
      }),
    );

    this.eventEmitter.emit('camera.setup.added', cameras);

    this.logger.debug(`Added new ${cameras.length} cameras to the database`);
  }

  /**
   * When camera is removed from the network, this event fires
   */
  @OnEvent('camera.removed')
  async cameraRemoved(event: CameraListChangeEvent) {
    const range = await this.rangeService.getDefault();
    if (!range) return;

    const cameras = await Promise.all(
      event.changed.map(async ({ cam, connection }) => {
        const camera = await this.cameraCrudService.findOne({
          ip_address: cam.ip,
          port: cam.port,
        });
        if (!camera) return;

        // We are not deleting camera yet, it will be done later
        // in the scheduled task.

        // Camera can just disconnect from the power and it will not send any data
        // to the opencv, but it will still be opened (whats strange)
        // and so we need to forcefully destroy a stream to make everything
        // clean

        await this.onvifService.removeCamera(camera);
        await this.cameraService.disableCamera(camera.id, true);
        await this.cameraCrudService.updateCamera(camera, {
          connected: false,
          disconnectedAt: new Date(),
        });

        return camera;
      }),
    );

    // ik this is shit, but who cares?
    this.eventEmitter.emit('camera.setup.removed', cameras);

    this.logger.debug(
      `Removed ${cameras.length} cameras from the system (marked as disconnected)`,
    );
  }
}
