import { ConflictException, Injectable } from '@nestjs/common';
import { ffprobe, FfprobeData } from 'fluent-ffmpeg';
import { CameraCrudService } from './camera-crud.service';
import { CameraErrors } from './constants';
import { ConnectCameraDto } from './dto/connect-camera.dto';
import { CameraProbeService } from './probe.service';
import { CameraStreamService } from './stream.service';
import { CameraContext } from './types';

@Injectable()
export class CameraService {
  constructor(
    private readonly probeService: CameraProbeService,
    private readonly crudService: CameraCrudService,
    private readonly streamService: CameraStreamService,
  ) {}

  /**
   * Connects new camera to the system manually.
   * Adds a camera into detectedCameras and starts connection pool.
   * @returns camera connection or undefined
   * @throws {ConflictException} if camera is already present in the detectedCameras map
   */
  async connectCamera(payload: ConnectCameraDto) {
    const mapKey = this.probeService.getMapKey({
      ip: payload.ip_address,
      port: payload.port,
    });
    const camera = this.probeService.detectedCameras.get(mapKey);
    if (camera) throw new ConflictException(CameraErrors.CameraAlreadyExist);

    this.probeService.detectedCameras.set(mapKey, {
      ip: payload.ip_address,
      port: payload.port,
      metadata: payload.kiosk_id ? { kioskId: payload.kiosk_id } : undefined,
      credentials: payload.isCredentialsProvided()
        ? {
            username: payload.username,
            password: payload.password,
          }
        : undefined,
      updatedAt: new Date(),
    });

    // Trying to connect to newly added camera
    // When this ends successfully, it will make all setup things automatically,
    // so we dont need to do it here
    await this.probeService.connectPool();

    return {
      connection: this.probeService.connectedCameras.get(mapKey) ?? null,
    };
  }

  /**
   * Disables a camera stream and marks camera as not streaming
   */
  async disableCamera(cameraId: number, streaming = false) {
    const camera = await this.crudService.findOne({ id: cameraId });
    await this.streamService.destroyStream(camera);
    await this.crudService.updateCamera(camera, {
      streaming: camera.streaming && streaming,
    });
  }

  /**
   * Updates stream url of the camera
   * @param camera camera to update
   * @param url new stream url
   * @returns updated camera
   * @throws {ConflictException} if stream url was not changed
   */
  async updateStreamURL(camera: CameraContext, url: string) {
    if (camera.stream_url === url)
      throw new ConflictException(CameraErrors.StreamWasNotChanged);

    await this.disableCamera(camera.id);
    return this.crudService.updateCamera(camera, {
      stream_url: url,
    });
  }

  /**
   * Stops and starts a camera stream.
   * @returns updated camera
   */
  async restartCameraStream(cameraId: number) {
    const camera = await this.crudService.findOne({ id: cameraId });
    // Stopping a stream
    await this.streamService.destroyStream(camera);

    // Starting it again
    if (camera.is_at_kiosk) await this.streamService.startKioskStream(camera);
    else if (camera.lane_name) await this.streamService.startLaneStream(camera);

    return camera;
  }

  /**
   * Removes a camera from database disabling stream from this camera
   */
  async removeCamera(cameraId: number) {
    await this.disableCamera(cameraId);
    await this.crudService.removeCamera(cameraId);
  }

  /**
   * Updates camera config
   * @returns updated camera
   */
  async updateConfig(cameraId: number, info: Partial<PrismaJson.CameraConfig>) {
    const camera = await this.crudService.findOne({ id: cameraId });
    return this.crudService.updateCamera(camera, {
      config: {
        ...camera.config,
        ...info,
      },
    });
  }

  /**
   * Returns an actual stream info
   */
  async getStreamInfo(cameraId: number): Promise<FfprobeData> {
    const camera = await this.crudService.findOne({ id: cameraId });
    return new Promise((resolve) =>
      ffprobe(camera.stream_url, (err, data) => resolve(data)),
    );
  }
}
