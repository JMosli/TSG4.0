import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { randomInt } from 'crypto';
import path from 'path';
import { ClientService } from 'src/client/client.service';
import { ConfigService } from 'src/config/config.service';
import { savingSettings } from '../constants';
import { FaceDetectDataEvent } from '../events/face-detect-start.event';
import { FaceDetectHostEvent } from '../face-service/lane-detection/types';
import { RecordingService } from '../recording/recording.service';
import { VideoProgress, VideoSegment } from '../types';
import { parseSilenceLog, parseTimeMark } from '../utils/ffmpeg.tools';
import { CameraLaneService } from './camera-lane.service';

@Injectable()
export class StartLaneRecordingService {
  private readonly logger = new Logger(StartLaneRecordingService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private readonly streamService: CameraLaneService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    private readonly recordingService: RecordingService,
  ) {}

  /**
   * Fires when some user came to the lane.
   * Creates ffmpeg processor threads for operating silence detection,
   * stream receiving and managing in lane clients.
   */
  @OnEvent('face_detect.start')
  async onFaceDetectionStart(data: FaceDetectDataEvent) {
    const faceId = randomInt(10 ** 7);
    const worker = this.streamService.detections.get(data.camera.id);

    // We need to create new client each time because faces are removed each
    // time user leaves a shooting range
    const client = await this.clientService.createClient({
      face_id: faceId,
      is_on_lane: true,
      camera: {
        connect: {
          id: data.camera.id,
        },
      },
    });

    // Creating new directory for client data
    const directories =
      await this.clientService.createClientDirectories(client);

    // As client entry contains a field that contains a path to the
    // client's directory, we need to update it
    await this.clientService.updateClient(client.id, {
      directory: directories.directory,
    });

    // These arrays are added into the inLaneClients as references,
    // so when we change them from this function, other function can also
    // se all changes
    const silenceSegments: VideoSegment[] = [];
    const videoProgress: VideoProgress = {
      frames: 0,
      currentFps: 0,
      currentKbps: 0,
      targetSize: 0,
      timemark: parseTimeMark('00:00:00.00'),
    };

    const fullVideo = path.resolve(
      directories.videosDirectory,
      savingSettings.FULL_VIDEO_NAME,
    );

    const silencedb = await this.configService.get<number>(
      'camera.stream.silence_db',
    );
    const peakDelta = await this.configService.get<number>(
      'camera.stream.sound_peak_record_delta',
    );

    // This must be as fast as it can be, so we are not
    // doing any re-encode nor filtering
    const videoProcessor = this.recordingService
      .createVideoProcessor(data.camera.stream_url, fullVideo)
      .audioFilter(
        `silencedetect=n=${silencedb.value}dB:d=${Math.min(1, peakDelta.value)}`,
      )
      .outputOption('-c:v', 'copy')
      //@ts-ignore
      .on('ffmpegClose', () => {
        // This runs after onFaceDetectionFinished sends SIGTERM to the
        // ffmpeg, so it exists normally without losing any data. After
        // this error, we can run sessionFinished and all files will be saved at this
        this.eventEmitter.emit('face_detect.ffmpeg.finished', data.camera);
      })
      .on('start', () => {
        // This property is private but we can access it
        // It appears only when process was successfully started
        //@ts-expect-error
        const stderr: net.Socket = videoProcessor.ffmpegProc.stderr;

        // I dont know why, but ffmpeg logs all data into
        // stderr stream
        stderr.on('data', (data) => {
          // When ffmpeg writes new data to the stdout,
          // we get a buffer of stdout data
          const lines = data.toString().split('\n');

          for (const line of lines) {
            if (line.includes('silencedetect')) console.log(line);
          }

          silenceSegments.push(
            ...lines
              .filter((line) => line.includes('silence_end'))
              .map((line) => parseSilenceLog(line))
              // just in case
              .filter((segment) => !!segment),
          );
        });
      })
      .on('error', (err: Error) => {
        this.logger.error(err);
      })
      .on('progress', (data) => {
        Object.assign(videoProgress, {
          ...data,
          timemark: parseTimeMark(data.timemark),
        });
      });

    videoProcessor.run();

    this.streamService.inLaneClients.set(data.camera.id, {
      client,
      videoProcessor,
      silenceSegments,
      videoProgress,
      isNoFaces: false,
    });

    // Tell worker where to save all faces
    worker.postMessage({
      event: 'client',
      data: {
        client,
        saveFacesTo: directories.faceDirectory,
      },
    } as FaceDetectHostEvent);

    this.logger.debug(
      `client ${client.id} came to the lane on camera ${data.camera.id}, collected ${data.numFaces} faces to ${faceId}`,
    );
  }
}
