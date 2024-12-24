import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { randomInt } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { ClientService } from 'src/client/client.service';
import { ConfigService } from 'src/config/config.service';
import { wait } from 'src/helpers/utils';
import { savingSettings } from '../constants';
import { FaceDetectDataEvent } from '../events/face-detect-start.event';
import { FaceRecognitionService } from '../face-service/recognition/recognition.service';
import { VideoService } from '../recording/video.service';
import { CameraContext } from '../types';
import {
  extendAndMergeSegments,
  formatTime,
  getTimemarkInSeconds,
  invertSegments,
} from '../utils/ffmpeg.tools';
import { CameraLaneService } from './camera-lane.service';
import { LaneRecordingUtilsService } from './utils.service';

@Injectable()
export class EndLaneRecordingService {
  private readonly logger = new Logger(EndLaneRecordingService.name);

  constructor(
    private eventEmitter: EventEmitter2,
    private readonly utilsService: LaneRecordingUtilsService,
    private readonly streamService: CameraLaneService,
    private readonly faceRecognizerService: FaceRecognitionService,
    private readonly configService: ConfigService,
    private readonly videoService: VideoService,
    private readonly clientService: ClientService,
  ) { }

  /**
   * Calls when ffmpeg stops processing a video.
   * Finishes all jobs of processing gathered data.
   */
  @OnEvent('face_detect.ffmpeg.finished')
  private async sessionFinished(camera: CameraContext) {
    const client = this.streamService.inLaneClients.get(camera.id);

    await wait(100 + randomInt(50));

    // This is a race condition, but I dont care because it does not affect anything
    if (!client || client.isNoFaces) return;

    const directories = this.clientService.getClientDirectory(client.client);
    await this.clientService.updateClient(client.client.id, {
      is_on_lane: false,
    });

    // We need to train a face recognizer model after person left a lane
    const matcherPath = path.resolve(
      directories.faceDirectory,
      savingSettings.MATCHER_NAME,
    );
    this.faceRecognizerService.train({
      client: client.client,
      faceDirectory: directories.faceDirectory,
      saveMatcherTo: matcherPath,
    });

    // Marking camera as inactive (so it does not have clients shooting on it)
    this.streamService.inLaneClients.delete(camera.id);

    // Wait additional time just in case to let ffmpeg save video file
    await wait(700);

    // My original idea was to store video chunks, combine them into
    // the buffer and pass this buffer into the ffmpeg using PassThrough
    // stream, but matroska container does not support stream seeking and also
    // nodejs have some problems with writing into stdin socket without calling cork
    // and uncork, so I just made so we save a video into temporary directory
    // for ffmpeg to seek it.

    const fullVideo = path.resolve(
      directories.videosDirectory,
      savingSettings.FULL_VIDEO_NAME,
    );
    const duration = getTimemarkInSeconds(client.videoProgress.timemark);
    const peakDelta = (
      await this.configService.get<number>(
        'camera.stream.sound_peak_record_delta',
      )
    ).value;

    const videoCommonValues = {
      camera: {
        connect: {
          id: camera.id,
        },
      },
      created_for: {
        connect: {
          id: client.client.id,
        },
      },
      range: {
        connect: {
          id: camera.rangeId,
        },
      },
    };

    // As we have only silence segments, we need to invert them to get
    // segments without silence.
    const notSilence = invertSegments(
      client.silenceSegments.toSorted((a, b) => a.start - b.start),
      client.videoProgress.timemark,
    );
    const extendedSegments = extendAndMergeSegments(notSilence, peakDelta);
    const shots = notSilence.map((s) => s.start);

    console.log(client.silenceSegments);
    console.log(notSilence);
    console.log(extendedSegments);

    await this.videoService.createVideo({
      duration,
      path: fullVideo,
      is_full: true,
      is_sold: false,
      manually_recorded: false,
      metadata: {
        shots: shots.map((s) => s.toString()),
      },
      ...videoCommonValues,
    });

    const genFrameCondition = (t) =>
      t > 0 ? `lt(prev_pts*TB\\,${t})*gte(pts*TB\\,${t})` : `eq(t\\,start_t)`;

    await new Promise((resolve) =>
      ffmpeg(fullVideo)
        .videoFilter(`select='${shots.map(genFrameCondition).join('+')}'`)
        .outputOption('-vsync', '0')
        .output(path.resolve(directories.photosDirectory, 'frame_%d.jpg'))
        .on('start', console.log)
        .on('end', resolve)
        .run(),
    );

    await Promise.all(
      shots.map((t, index) => {
        const oldPhoto = path.resolve(
          directories.photosDirectory,
          `frame_${index + 1}.jpg`,
        );
        const newPhoto = path.resolve(
          directories.photosDirectory,
          `frame_${t}.jpg`,
        );
        return fs.rename(oldPhoto, newPhoto);
      }),
    );

    // Waiting for all video segments to process
    await Promise.all(
      extendedSegments.map(async (segment, index) => {
        const file = path.resolve(
          directories.videosDirectory,
          `segment_${index}.mkv`,
        );

        const segmentDuration = segment.end - segment.start;
        const segmentStart = formatTime(segment.start);

        const videoEntry = await this.videoService.createVideo({
          path: file,
          is_sold: false,
          manually_recorded: false,
          duration: segmentDuration,
          metadata: {
            segment,
          },
          ...videoCommonValues,
        });

        // Seeking input video from segment.start
        // to segment.end using input option to make it without re-encoding
        // so this process of getting a cut of full video is almost instant
        const processor = await new Promise((resolve) => {
          //prettier-ignore
          ffmpeg(fullVideo)
            .inputFormat('matroska')
            .inputOptions([
              '-noaccurate_seek',
              '-ss', segmentStart,
            ])
            .outputOptions([
              '-t', formatTime(segmentDuration),
              '-threads', '1',
              "-c", "copy"
            ])
            .save(file)
            .on('start', console.log)
            .on('error', (stdout) => this.logger.error(stdout))
            .on('end', resolve);
        });

        return processor;
      }),
    );

    this.logger.debug('completed video processing');

    this.eventEmitter.emit('camera.client.processing_finished', client.client);

    this.logger.debug(
      `client ${client.client.id} finished shooting on the camera ${camera.id}`,
    );
  }

  /**
   * Fires when some user left a lane.
   */
  @OnEvent('face_detect.finished')
  private async onFaceDetectionFinished(data: FaceDetectDataEvent) {
    const client = this.streamService.inLaneClients.get(data.camera.id);
    const worker = this.streamService.detections.get(data.camera.id);

    // And start detection stream again
    // to get new users
    this.streamService.createReceiver(data.camera, data.camera.stream_url);

    if (!client) {
      return this.logger.warn(
        `could not find client on camera ${data.camera.id} but it finished?? strange`,
      );
    }

    // Because we are stopping recording before removing a client,
    // we need to notify sessionFinished function about a situation
    // when we have got no faces
    if (!data.numFaces) client.isNoFaces = true;

    await this.utilsService.killFfmpeg(client.videoProcessor);

    // Got just some random dude appeared on video (or any other situation)
    // So we have not gathered needed amount of faces and we can not process a client
    if (!data.gotFaces) {
      await wait(300);

      this.streamService.inLaneClients.delete(data.camera.id);
      await this.clientService.removeClient(client.client.id, true);

      return this.logger.debug(
        `client ${client.client.id} left without getting needed amount of faces, removed him`,
      );
    }

    this.logger.debug(`finished first phase, collected ${data.numFaces} faces`);
  }
}
