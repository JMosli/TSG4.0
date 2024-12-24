import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Client, Prisma } from '@prisma/client';
import { randomInt } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { savingSettings } from 'src/camera/constants';
import { RecordingErrors } from 'src/camera/recording/constants';
import { CryptoService } from 'src/crypto/crypto.service';
import { PaginateDto } from 'src/helpers/paginate/types';
import { PrismaService } from 'src/helpers/prisma.service';
import { rmdir } from 'src/helpers/utils';
import { RangeService } from 'src/range/range.service';
import { setupSettings } from 'src/setup/constants';
import { ClientErrors } from './constants';

@Injectable()
export class ClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rangeService: RangeService,
    private readonly cryptoService: CryptoService,
  ) {}

  /**
   * Finds many clients with the specified parameters
   */
  async find(where: Prisma.ClientWhereInput, pagination?: PaginateDto) {
    const [count, items] = await this.prisma.$transaction([
      this.prisma.client.count({ where }),
      this.prisma.client.findMany({
        where,
        ...pagination,
        orderBy: {
          id: 'desc',
        },
        include: {
          videos: {
            select: {
              id: true,
              is_full: true,
              duration: true,
              metadata: true,
            },
          },
        },
      }),
    ]);

    return { count, items };
  }

  /**
   * Finds one client in the database
   * @throws {NotFoundException} if client was not found
   */
  async findOne(where: Prisma.ClientWhereInput) {
    const result = await this.prisma.client.findFirst({
      where,
      include: {
        videos: { select: { id: true } },
      },
    });
    if (!result) throw new NotFoundException(ClientErrors.ClientNotFound);

    return result;
  }

  /**
   * Creates a client in the database
   */
  createClient(payload: Prisma.ClientCreateInput) {
    return this.prisma.client.create({ data: payload });
  }

  /**
   * Updates an existing client in the database by its id
   */
  updateClient(clientId: number, payload: Prisma.ClientUpdateInput) {
    return this.prisma.client.update({
      where: { id: clientId },
      data: payload,
    });
  }

  /**
   * Removes all data for the specified client including
   * directories and database entries
   * @throws {ConflictException} if client is currently on lane
   */
  async removeClient(clientId: number, force: boolean = false) {
    const client = await this.findOne({ id: clientId });

    // need to check if client is shooting on the lane at the moment
    if (client.is_on_lane && !force)
      throw new ConflictException(ClientErrors.CurrentlyOnLane);

    const directories = this.getClientDirectory(client);

    await rmdir(directories.directory);
    return this.prisma.client.delete({
      where: { id: clientId },
    });
  }

  /**
   * Creates all temporary directories for data storage for one specific client
   * saving provided faces into the faces directory.
   * @returns created directories
   */
  async createClientDirectories(client: Client) {
    const { directory, faceDirectory, videosDirectory, photosDirectory } =
      this.getClientDirectory(client);

    await fs.mkdir(directory);
    await fs.mkdir(faceDirectory);
    await fs.mkdir(videosDirectory);
    await fs.mkdir(photosDirectory);

    // Saving client options to json file
    const clientOptions = path.resolve(
      directory,
      savingSettings.USER_OPTIONS_NAME,
    );
    await fs.writeFile(clientOptions, JSON.stringify({ ...client, directory }));

    return { directory, faceDirectory, videosDirectory };
  }

  /**
   * Retrieves created directories for one specific client.
   * @returns directory paths
   */
  getClientDirectory(client: Client) {
    const directory = path.resolve(
      setupSettings.CLIENTS_PATH,
      `client_${client.id}`,
    );
    const faceDirectory = path.resolve(directory, `face_${client.face_id}`);
    const videosDirectory = path.resolve(directory, `videos`);
    const photosDirectory = path.resolve(directory, `photos`);

    return { directory, faceDirectory, videosDirectory, photosDirectory };
  }

  /**
   * Generates a unique token for the video, for example, to use
   * to buy it on a global server
   */
  async getToken(client: Client, obj: { vid?: number; p?: string } = {}) {
    const range = await this.rangeService.getDefault();
    const json = JSON.stringify({
      cid: client.id,
      e: randomInt(1, 100),
      ...obj,
    });
    const input = Buffer.from(json).toString('base64url');
    const signature = this.cryptoService
      .createSignature(input, range.private_key_signer)
      .toString('base64url');

    return `${range.global_id}|${input}.${signature}`;
  }

  /**
   * Generates a token for one specific media
   */
  async getMediaToken(clientId: number, videoId?: number, frame?: string) {
    if (!videoId && !frame) throw new BadRequestException();

    const client = await this.findOne({ id: clientId });
    const video = videoId && client.videos.find((v) => v.id === videoId);

    if (videoId && !video)
      throw new NotFoundException(RecordingErrors.VideoNotFound);

    return {
      token: await this.getToken(client, {
        vid: video?.id ?? undefined,
        p: frame,
      }),
    };
  }
}
