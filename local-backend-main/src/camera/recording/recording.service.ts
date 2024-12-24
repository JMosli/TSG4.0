import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  default as ffmpeg,
  FfmpegCommand,
  ffprobe,
  FfprobeData,
} from 'fluent-ffmpeg';
import { createReadStream, existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { ClientService } from 'src/client/client.service';
import { UserContext } from 'src/helpers/types';
import { setupSettings } from 'src/setup/constants';
import { PassThrough } from 'stream';
import { CameraCrudService } from '../camera-crud.service';
import { formatTime } from '../utils/ffmpeg.tools';
import { RecordingErrors } from './constants';
import { VideoService } from './video.service';

@Injectable()
export class RecordingService {
  private readonly logger = new Logger(RecordingService.name);

  /**
   * Contains a map of active cameras that are used for recording a stream
   */
  public readonly activeCameras: Map<number, FfmpegCommand> = new Map();

  constructor(
    private readonly videoService: VideoService,
    private readonly cameraCrudService: CameraCrudService,
    private readonly clientService: ClientService,
  ) {}

  /**
   * Returns if a camera is in state of recording video right now
   */
  async getStatus(cameraId: number) {
    return { is_active: this.activeCameras.has(cameraId) };
  }

  /**
   * Builds a ffmpeg command to process video and returns it
   * Note: it does not run anything, just returns
   */
  createVideoProcessor(streamURL: string, output: string) {
    const videoProcessor = ffmpeg(streamURL)
      .format('matroska')
      .inputOption('-rtsp_transport', 'tcp')
      .outputOption('-max_muxing_queue_size', '8192')
      .output(output)
      .on('error', (err, stdout, stderr) => {
        this.logger.error(err);
        this.logger.error(stdout);
        this.logger.error(stderr);
      })
      .on('start', (command) => {
        this.logger.debug(`running command: ${command}`);

        //@ts-expect-error
        videoProcessor.ffmpegProc.on('close', () => {
          // This runs when process is closed, and we are emitting custom event
          // to indicate that process was exited
          //@ts-ignore
          videoProcessor.emit('ffmpegClose', streamURL);
        });
      });

    return videoProcessor;
  }

  /**
   * Generates a path for new video, starts a recording and returns command with the path.
   *
   * Note: by default it marks video as manually recorded. To change that, set \<recorded\> field
   * in the saveParams to false
   * @param saveParams used to change parameters of the video saved in the database after recording
   * is complete. It can be used to, for example, connect a client
   * @returns [command, path]
   */
  async startRecording(
    cameraId: number,
    saveParams: Partial<Prisma.VideoCreateArgs> = {},
  ): Promise<[FfmpegCommand, string]> {
    const status = await this.getStatus(cameraId);
    if (status.is_active)
      throw new ConflictException(RecordingErrors.AlreadyRecording);

    const camera = await this.cameraCrudService.findOne({ id: cameraId });
    const fullPath = this.videoService.generatePath(
      setupSettings.RECORDING_PATH,
      'mkv',
    );
    const promise = new Promise<FfmpegCommand>((resolve) => {
      const command = this.createVideoProcessor(camera.stream_url, fullPath)
        .on('start', () => {
          this.activeCameras.set(cameraId, command);
          resolve(command);
        })
        //@ts-ignore
        .on('ffmpegClose', async () => {
          this.activeCameras.delete(cameraId);
          await this.videoService.createVideo({
            range: {
              connect: {
                id: camera.rangeId,
              },
            },
            camera: {
              connect: {
                id: camera.id,
              },
            },
            manually_recorded: true,
            is_sold: false,
            path: fullPath,
            ...saveParams,
          });
        });

      command.run();
    });

    return [await promise, fullPath];
  }

  /**
   * Stops a recording on the specific camera if it was started
   */
  stopRecording(cameraId: number) {
    const command = this.activeCameras.get(cameraId);
    if (!command) return;

    //@ts-expect-error
    command.ffmpegProc.stdin.end();
    command.kill('SIGTERM');

    return new Promise((resolve) => {
      //@ts-ignore
      command.on('ffmpegClose', resolve);
    });
  }

  /**
   * Returns a streamable file to stream it into browser
   * @throws {NotFoundException} if user does not have enough rights to play video
   * @throws {InternalServerErrorException} if video was not found in the filesystem
   */
  async streamVideo(videoId: number, user: UserContext | null) {
    const video = await this.videoService.findOne({ id: videoId });
    // If user doesnt have enough right to get a video
    if (
      video.manually_recorded &&
      !user?.is_global_admin &&
      !user?.is_owner &&
      !user?.is_sg
    )
      throw new NotFoundException();

    const exists = existsSync(video.path);
    if (!exists)
      throw new InternalServerErrorException(RecordingErrors.VideoNotFound);

    try {
      const file = createReadStream(video.path);
      return new StreamableFile(file);
    } catch {
      throw new InternalServerErrorException();
    }
  }

  /**
   * Returns a single frame from the video
   */
  async getFrame(videoId: number, frame: number) {
    const video = await this.videoService.findOne({ id: videoId });

    if (video.clientId) {
      // if this video appears to be connected to the client, we can try
      // searching already ready image from a filesystem of a client
      const client = await this.clientService.findOne({ id: video.clientId });
      const directories = this.clientService.getClientDirectory(client);
      const photo = path.resolve(
        directories.photosDirectory,
        `frame_${frame}.jpg`,
      );
      if (existsSync(photo)) {
        return fs.readFile(photo);
      }
    }

    const screenshot = [];
    const photoPipe = new PassThrough();
    photoPipe.on('data', (d) => screenshot.push(d));

    // taking a screenshot from the video
    // using ffmpeg
    await new Promise((resolve) => {
      ffmpeg(video.path)
        .outputFormat('mjpeg')
        .inputOptions(['-ss', formatTime(frame)])
        .outputOptions(['-q:v', '2', '-frames:v', '1'])
        .on('start', console.log)
        .on('error', (stdout) => this.logger.error(stdout))
        .on('end', resolve)
        .pipe(photoPipe);
    });

    return Buffer.concat(screenshot);
  }

  async getFullVideoData(videoId: number) {
    const video = await this.videoService.findOne({ id: videoId });
    const probeResult: FfprobeData | null = await new Promise((resolve) =>
      ffprobe(video.path, (err, metadata) => resolve(err ? null : metadata)),
    );

    return {
      ...video,
      metadata: probeResult,
    };
  }
}
