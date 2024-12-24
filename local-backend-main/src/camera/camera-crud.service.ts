import { Injectable, NotFoundException } from '@nestjs/common';
import { Camera, Prisma } from '@prisma/client';
import { PaginateDto } from 'src/helpers/paginate/types';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeService } from 'src/range/range.service';
import { CameraErrors } from './constants';
import { CreateCameraDto } from './dto/create-camera.dto';

/**
 * Basically just camera-related CRUD
 */
@Injectable()
export class CameraCrudService {
  constructor(
    private prisma: PrismaService,
    private readonly rangeService: RangeService,
  ) {}

  /**
   * Finds a camera with matching parameters
   * @returns found camera
   * @throws {NotFoundException} if camera was not found
   */
  async findOne(where: Prisma.CameraWhereInput, throws: boolean = true) {
    const camera = await this.prisma.camera.findFirst({ where });
    if (!camera && throws)
      throw new NotFoundException(CameraErrors.CameraNotFound);

    return camera;
  }

  /**
   * Finds multiple cameras in the database
   */
  find(where: Prisma.CameraWhereInput) {
    return this.prisma.camera.findMany({ where });
  }

  /**
   * Finds multiple cameras in the database with pagination
   */
  async paginate(where: Prisma.CameraWhereInput, pagination: PaginateDto) {
    const [count, items] = await this.prisma.$transaction([
      this.prisma.camera.count({ where }),
      this.prisma.camera.findMany({ where, ...pagination }),
    ]);

    return { count, items };
  }

  /**
   * Creates new camera in the database
   * @param payload new camera options
   * @returns created camera entry
   */
  async createCamera(
    payload: CreateCameraDto & {
      streaming: boolean;
      connected: boolean;
      config?: PrismaJson.CameraConfig;
    },
  ) {
    return this.prisma.camera.create({
      data: {
        ...payload,
        original_stream_url: payload.stream_url,
        is_at_kiosk: !!payload.kiosk_id,
        kiosk: payload.kiosk_id
          ? { connect: { id: payload.kiosk_id } }
          : undefined,
        range: {
          connect: await this.rangeService.getDefault(),
        },
        //@ts-expect-error
        kiosk_id: undefined,
      },
    });
  }

  /**
   * Updates a camera database entry
   * @param data new data
   * @returns updated camera entry
   */
  async updateCamera(camera: Camera, data: Prisma.CameraUpdateInput) {
    return this.prisma.camera.update({
      where: { id: camera.id },
      data,
    });
  }

  /**
   * Removes many cameras from the database
   */
  async removeCameras(where: Prisma.CameraWhereInput) {
    return this.prisma.camera.deleteMany({ where });
  }

  /**
   * Removes camera from the database
   * @param cameraId id of the camera to be removed
   * @returns removed camera
   * @throws {NotFoundException} if camera was not found
   */
  async removeCamera(cameraId: number) {
    const camera = await this.findOne({ id: cameraId });
    if (!camera) throw new NotFoundException(CameraErrors.CameraNotFound);

    return this.prisma.camera.delete({
      where: { id: camera.id },
    });
  }
}
