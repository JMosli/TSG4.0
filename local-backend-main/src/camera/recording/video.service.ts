import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import path from 'path';
import { PaginateDto } from '../../helpers/paginate/types';
import { PrismaService } from '../../helpers/prisma.service';
import { RecordingErrors } from './constants';

@Injectable()
export class VideoService {
  constructor(
    private eventEmitter: EventEmitter2,
    private prisma: PrismaService,
  ) {}

  /**
   * Generates a full path for a new video file
   * @param base absolute path to the directory where the video needs to be saved
   * @param ext file extension without dot (ex: mp4, mkv)
   * @param generator modifies a default file name with custom generator
   * @returns full path
   * @example
   * generatePath(setupSettings.CLIENTS_PATH, "mkv", (name) => `segment_${name}`);
   * // -> <CLIENTS_PATH>/segment_gp_12345_12345.mkv
   */
  generatePath(
    base: string,
    ext: string,
    generator: (name: string) => string = (n) => n,
  ) {
    const name = generator(`gp_${randomInt(0, 99999)}_${Date.now()}.${ext}`);
    const fullPath = path.resolve(base, name);

    return fullPath;
  }

  /**
   * Creates a video database entry
   */
  async createVideo(data: Prisma.VideoCreateInput) {
    const video = await this.prisma.video.create({
      data,
    });
    this.eventEmitter.emit('camera.recording.added', video);

    return video;
  }

  /**
   * Gets all recordings in the database with the specified parameters
   */
  async find(where: Prisma.VideoWhereInput, pagination?: PaginateDto) {
    const [count, items] = await this.prisma.$transaction([
      this.prisma.video.count({ where }),
      this.prisma.video.findMany({
        where,
        skip: pagination?.skip ?? undefined,
        take: pagination?.take ?? undefined,
      }),
    ]);

    return { count, items };
  }

  /**
   * Finds one video from the database
   * @throws {NotFoundException} if video was not found
   */
  async findOne(where: Prisma.VideoWhereInput) {
    const result = await this.prisma.video.findFirst({ where });
    if (!result) throw new NotFoundException(RecordingErrors.VideoNotFound);

    return result;
  }

  /**
   * Removes a video from the database and cleans up a filesystem
   */
  async removeVideo(where: Prisma.VideoWhereInput) {
    const video = await this.findOne(where);
    // we dont care if video does not exist
    if (existsSync(video.path)) await rm(video.path);

    return this.prisma.video.delete({ where: { id: video.id } });
  }
}
