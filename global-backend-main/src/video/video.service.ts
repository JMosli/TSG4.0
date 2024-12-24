import {
  ConflictException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import fs, { stat } from 'fs/promises';
import ffmmpeg from 'ffmpeg';
import { LocalFileService } from 'src/file/local-file.service';
import { VideoErrors, videoTranscoding } from './constants';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeContext } from 'src/range/constants';
import { FileContext } from 'src/file/constants';
import { Payment, Prisma } from '@prisma/client';
import { PaginateDto } from 'src/helpers/paginate/types';
import { createReadStream } from 'fs';
import { randomInt } from 'crypto';

@Injectable()
export class VideoService {
  constructor(
    private prisma: PrismaService,
    private readonly fileService: LocalFileService,
  ) {}

  /**
   * Performs upload video procedure:
   *  1. Saves temporary file to let ffmpeg process it
   *  2. Compresses file using ffmpeg and options provided in the videoTranscoding constant
   *  3. Removes temporary file, saves output to the actual file and returns its database entry
   * @param range range to add video to
   * @param payload video binary
   * @returns created video
   */
  async uploadVideo(
    range: RangeContext,
    payment: Payment,
    file: Express.Multer.File,
    localId: number,
  ) {
    const video = await this.prisma.video.findFirst({
      where: {
        local_id: localId,
        rangeId: range.id,
      },
    });
    if (video) throw new ConflictException(VideoErrors.VideoAlreadyUploaded);

    const tempFilePath = file.path;
    const outputFile = await this.fileService.createFile(
      Buffer.alloc(0),
      'mp4',
    );

    // As ffmpeg can't process raw Buffer instances, we need to manage temporary file
    // before ffmpeg transcoder was launched.
    const videoTranscoder = await new ffmmpeg(tempFilePath);
    videoTranscoder.addCommand('-crf', videoTranscoding.CRF);
    videoTranscoder.addCommand('-preset', 'veryfast');
    videoTranscoder.addCommand('-c:v', 'libx264');
    videoTranscoder.addCommand('-c:a', 'aac');
    videoTranscoder.addCommand('-y', '');
    await videoTranscoder.save(outputFile.url);

    await fs.rm(tempFilePath);

    return this.createVideo({
      range,
      payment,
      file: outputFile,
      localId,
    });
  }

  /**
   * Creates video entry in the database
   * @returns created video
   */
  async createVideo({
    localId,
    range,
    file,
    payment,
  }: {
    localId: number;
    range: RangeContext;
    file: FileContext;
    payment: Payment;
  }) {
    return this.prisma.video.create({
      data: {
        local_id: localId,
        payment: { connect: { id: payment.id } },
        range: { connect: { id: range.id } },
        file: { connect: { id: file.id } },
      },
    });
  }

  /**
   * Removes a video from the database and from filesystem.
   * @param videoId id of the video to remove
   * @returns removed video
   * @throws {NotFoundException} if video was not found in the database
   */
  async deleteVideo(videoId: number) {
    const video = await this.findVideo({ id: videoId });
    if (!video) throw new NotFoundException(VideoErrors.VideoNotFound);

    const removedVideo = await this.prisma.video.delete({ where: video });

    await this.fileService.deleteFile(video.fileId);

    return removedVideo;
  }

  /**
   * Finds one video from the database by id
   * @param videoId id of the video to find in the database
   * @returns found video
   */
  findVideo(where: Prisma.VideoWhereInput) {
    return this.prisma.video.findFirst({ where });
  }

  /**
   * Finds all videos in the database with matching parameters
   */
  findVideos(where: Prisma.VideoWhereInput, { skip, take }: PaginateDto) {
    return this.prisma.$transaction([
      this.prisma.video.count({ where }),
      this.prisma.video.findMany({ where, skip, take }),
    ]);
  }

  /**
   * Gets some random videos
   */
  async getRandomVideos(count: number) {
    const videoCount = await this.prisma.video.count();
    const ids = new Array(count).fill(null).map(() => randomInt(videoCount));
    return this.prisma.video.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        uid: true,
      },
    });
  }

  /**
   * Returns a StreamableFile for controller to return
   */
  async streamFile(videoUid: string, download: boolean = false) {
    const video = await this.findVideo({ uid: videoUid });
    if (!video) throw new NotFoundException(VideoErrors.VideoNotFound);

    const file = await this.fileService.findFile(video.fileId);
    const readStream = createReadStream(file.url);
    const fileStat = await stat(file.url);

    return new StreamableFile(readStream, {
      length: fileStat.size,
      disposition: download ? 'attachment; filename="video.mp4"' : undefined,
    });
  }
}
