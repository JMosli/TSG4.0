import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as nodeOnvif from 'node-onvif-ts-extended';
import { AgentDVRService } from './agentdvr/agentdvr.service';
import { CameraCrudService } from './camera-crud.service';
import { CameraErrors } from './constants';
import { CameraStreamService } from './stream.service';
import { CameraContext, OnvifCameraProbe } from './types';

/**
 * Makes all onvif operations
 */
@Injectable()
export class OnvifService {
  private readonly logger = new Logger(OnvifService.name);
  public readonly devices: Map<number, [OnvifCameraProbe, nodeOnvif.OnvifDevice]> = new Map();

  constructor(
    private readonly streamService: CameraStreamService,
    private readonly crudService: CameraCrudService,
    private readonly agentdvrService: AgentDVRService,
  ) {}

  /**
   * Prepares the specified device to operate in the system
   *
   * @returns gathered info about camera
   */
  async setupCamera(
    camera: CameraContext | undefined,
    conn: [OnvifCameraProbe, nodeOnvif.OnvifDevice],
  ) {
    const device = conn[1]
    // Gets all necessary information for node-onvif
    // to work. Basically caches stream uris, profile tokens
    // and these things to work faster.
    // All these functions are private, so we ignore them
    let profiles: nodeOnvif.Profile[] = await device
      //@ts-expect-error
      .mediaGetProfiles()
      //@ts-expect-error
      .then(() => device.mediaGetStreamUri())
      .then(() => device.getProfileList());

    let stream = profiles[0].stream.rtsp;

    if (camera && camera.stream_url && stream !== camera.stream_url) {
      // stream url somehow changed, we assume that admin has changed
      // it and we dont do anything about it
      this.logger.debug(
        `camera ${camera.id} stream url in database is not equal to actual url: ${camera.stream_url} !== ${stream}, using db version`,
      );
      stream = camera.stream_url;
    }

    // Starting previous stream if it was enabled
    if (camera?.streaming) {
      this.logger.debug(
        `camera was streaming, starting receiver. is_at_kiosk: ${camera.is_at_kiosk}`,
      );
      if (camera.is_at_kiosk) {
        if (camera.kioskId) {
          this.streamService.startKioskStream(camera);
        } else {
          this.logger.warn(
            `camera was at kiosk, but it was not found, marking ${camera.id} as not attached`,
          );
          await this.crudService.updateCamera(camera, {
            streaming: false,
            is_at_kiosk: false,
          });
        }
      } else if (camera.lane_name) {
        this.streamService.startLaneStream(camera);
      } else {
        this.logger.warn(
          `camera was streaming, but is not attached, marking ${camera.id} as not streaming`,
        );
        await this.crudService.updateCamera(camera, {
          streaming: false,
        });
      }
    }

    if (camera) {
      this.devices.set(camera.id, conn);
      this.setupAgentdvr(camera);
      this.setupCameraTexts(camera.id) 
    }

    return { stream, profile: profiles[0] };
  }

  /**
   * Sets the agentdvr up
   */
  async setupAgentdvr(camera: CameraContext) {
    // this is not perfect of course, but you cannot a
    // list of all cameras the other way
    const cameraObject = await this.agentdvrService.getCameraObject(camera);
    if (!cameraObject) return;
    if (cameraObject.length > 0) return;

    await this.agentdvrService.addCamera({
      uri: `http://${camera.ip_address}:${camera.port}/onvif/device_service`,
      mainstream: 0,
      substream: 1,
      name: `Camera|${camera.id}`,
      username: camera.username,
      password: camera.password,
      fps: 15,
      recfps: 15,
      alerts: 1,
      raw: 0,
      resize: 0,
      record: 1,
    });
  }

  /**
   * Sets up a text on a camera if its possible
   */
  async setupCameraTexts(cameraId: number) {
    const conn = this.devices.get(cameraId);
    if (!conn) throw new NotFoundException(CameraErrors.OnvifUnavailable);

    const device = conn[0]
    const osds = (await device.getOSDs()) ?? []

    await Promise.all(osds.map(async (osd) => {
      //@ts-expect-error
      device.deleteOSD(osd.token)
    }))
  }

  /**
   * Cleans up the internal variables
   */
  async removeCamera(camera: CameraContext) {
    this.devices.delete(camera.id);
  }

  /**
   * Returns a list of profiles for a camera
   */
  async getProfiles(cameraId: number) {
    const conn = this.devices.get(cameraId);
    if (!conn) throw new NotFoundException(CameraErrors.OnvifUnavailable);

    return conn[1].getProfileList();
  }
}
