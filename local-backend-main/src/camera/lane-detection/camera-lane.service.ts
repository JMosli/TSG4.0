import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@prisma/client';
import cv from '@u4/opencv4nodejs';
import { FfmpegCommand } from 'fluent-ffmpeg';
import * as WorkerEngine from 'shinobi-worker';
import { ClientService } from 'src/client/client.service';
import { ConfigService } from 'src/config/config.service';
import { LaneFaceDetectService } from '../face-service/lane-detection/detection.service';
import { CameraContext, Size, VideoProgress, VideoSegment } from '../types';
import { LaneRecordingUtilsService } from './utils.service';

@Injectable()
export class CameraLaneService {
  private readonly logger = new Logger(CameraLaneService.name);

  /**
   * Contains a list of clients currently shooting.
   * A key is a camera id.
   */
  public readonly inLaneClients: Map<
    number,
    {
      client: Client;
      videoProcessor: FfmpegCommand;
      silenceSegments: VideoSegment[];
      videoProgress: VideoProgress;
      isNoFaces: boolean;
    }
  > = new Map();

  /**
   * A map of running detection jobs.
   * A key is camera id.
   */
  public readonly detections: Map<number, WorkerEngine.Worker> = new Map();

  constructor(
    private readonly faceDetectService: LaneFaceDetectService,
    private readonly utilsService: LaneRecordingUtilsService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
  ) {
    this.logger.debug('initialized lane stream module');
    this.logger.debug(`cv.modules.face: ${cv.modules.face}`);
  }

  /**
   * Create face detection task.
   * After this, all operation will be done through event passing in face_detect namespace
   */
  async createReceiver(camera: CameraContext, streamURI: string) {
    const c = this.configService;
    const get = <V>(key: string) => c.get<V>(key, { throws: true })

    const minFaceSize = await get<Size>('camera.detection.min_face_size');
    //prettier-ignore
    const useLiveModel = await get<boolean>('camera.detection.use_live_model_detection');

    const worker = this.faceDetectService.startDetection({
      camera,
      streamURI,
      //prettier-ignore
      config: {
        maxNoFaces: (await get<number>("camera.detection.lane.max_frames_without_faces")).value,
        startFaces: (await get<number>('camera.detection.lane.min_start_faces')).value,
        minFaces: (await get<number>('camera.detection.lane.min_faces')).value,
        scaleFactor: (await get<number>('camera.detection.multiscale_scale_factor')).value,
        classifier: (await get<string>('camera.detection.lane.classifier')).value,
        minFaceSize: [minFaceSize.value.width, minFaceSize.value.height],
        liveModel: useLiveModel.value,
      },
    });

    this.detections.set(camera.id, worker);
  }

  /**
   * Destroys a receiver.
   * Exists camera detection process, kills ffmpeg and removes client if
   * camera is active
   */
  async destroyReceiver(camera: CameraContext) {
    const worker = this.detections.get(camera.id);
    if (!worker) return null;

    // Killing current detection process
    worker.kill('SIGTERM');

    const client = this.inLaneClients.get(camera.id);
    if (!client) return;

    // Clean up existing client
    this.inLaneClients.delete(camera.id);
    await this.utilsService.killFfmpeg(client.videoProcessor);
    await this.clientService.removeClient(client.client.id);
  }
}
