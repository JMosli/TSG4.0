import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { Payment } from '@prisma/client';
import { LocalFileService } from 'src/file/local-file.service';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeContext } from 'src/range/constants';
import { PhotoErrors } from './constants';
import { createReadStream } from 'fs';
import { randomInt } from 'crypto';

@Injectable()
export class PhotoService {
  constructor(
    private prisma: PrismaService,
    private readonly fileService: LocalFileService,
  ) {}

  /**
   * Uploads a new photo
   */
  async uploadPhoto(range: RangeContext, payment: Payment, file: Buffer) {
    const outputFile = await this.fileService.createFile(file, '.jpg');
    return this.prisma.photo.create({
      data: {
        file: { connect: { id: outputFile.id } },
        range: { connect: { id: range.id } },
        payment: { connect: { id: payment.id } },
      },
    });
  }

  /**
   * Gets some random videos
   */
  async getRandomPhotos(count: number) {
    const videoCount = await this.prisma.photo.count();
    const ids = new Array(count).fill(null).map(() => randomInt(videoCount));
    return this.prisma.photo.findMany({
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
   * Creates a photo file response
   */
  async streamFile(photoUid: string, download?: boolean) {
    const photo = await this.prisma.photo.findFirst({
      where: { uid: photoUid },
    });
    if (!photo) throw new NotFoundException(PhotoErrors.PhotoNotFound);

    const file = await this.fileService.findFile(photo.fileId);
    const stream = createReadStream(file.url);

    return new StreamableFile(stream, {
      disposition: download ? 'attachment; filename="photo.jpeg"' : undefined,
      type: 'image/jpeg',
    });
  }
}
