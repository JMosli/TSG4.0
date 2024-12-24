import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CameraCrudService } from 'src/camera/camera-crud.service';
import { CameraStreamService } from 'src/camera/stream.service';
import { PaginateDto } from 'src/helpers/paginate/types';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeService } from 'src/range/range.service';
import { KioskErrors } from './constants';

@Injectable()
export class KioskService {
  constructor(
    private prisma: PrismaService,
    private readonly rangeService: RangeService,
    private readonly cameraCrudService: CameraCrudService,
    private readonly cameraStreamService: CameraStreamService,
  ) {}

  /**
   * Finds one kiosk with the specified parameters on the
   * default range
   * @throws {NotFoundException} if kiosk was not found
   */
  async findOne(where: Prisma.KioskWhereInput) {
    const range = await this.rangeService.getDefault();
    const kiosk = await this.prisma.kiosk.findFirst({
      where: { range: { id: range.id }, ...where },
      include: { camera: true, terminal: true },
    });
    if (!kiosk) throw new NotFoundException(KioskErrors.KioskNotFound);

    return kiosk;
  }

  /**
   * Returns analytics parameters for the kiosk
   */
  async analytics(kioskId: number) {
    const kiosk = await this.findOne({ id: kioskId });

    const priceByDay = await this.prisma.$queryRaw`
      SELECT DATE("createdAt") as "date", CAST(COUNT(*) AS INT) as "count"
      FROM "PaymentSession"
      WHERE "kioskId" = ${kioskId}
      GROUP BY DATE("createdAt")
      ORDER BY "date";
    `;

    const clients = await this.prisma.paymentSession.count({
      where: { kioskId },
    });

    return { price_by_day: priceByDay, clients };
  }

  /**
   * Finds multiple kiosks in the database with pagination
   * on the default range
   */
  async paginate(where: Prisma.KioskWhereInput, pagination: PaginateDto) {
    const range = await this.rangeService.getDefault();
    const rangeWhere = { range: { id: range.id }, ...where };

    const [count, items] = await this.prisma.$transaction([
      this.prisma.kiosk.count({ where: rangeWhere }),
      this.prisma.kiosk.findMany({
        where: rangeWhere,
        ...pagination,
        include: { camera: { select: { id: true } } },
      }),
    ]);

    return { count, items };
  }

  /**
   * Creates new kiosk on default range.
   * @throws {NotFoundException} if default range was not found
   */
  async createKiosk() {
    const range = await this.rangeService.getDefault();

    return this.prisma.kiosk.create({
      data: {
        is_connected: true,
        range: {
          connect: { id: range.id },
        },
      },
    });
  }

  /**
   * Attaches a camera to the kiosk staring kiosk detection
   * module, so camera starts detecting faces using kiosk
   * detection strategy
   * @returns updated kiosk
   * @throws {ConflictException} if camera is attached to the lane
   */
  async attachCamera(kioskId: number, cameraId: number) {
    const kiosk = await this.findOne({ id: kioskId });
    const camera = await this.cameraCrudService.findOne({ id: cameraId });

    // If camera is attached to the lane, we dont want to detach it automatically
    // but just ask user to do it manually
    if (!camera.is_at_kiosk && camera.lane_name && camera.streaming)
      throw new ConflictException(KioskErrors.CameraIsAttached);

    // If user tries to attach camera to the same kiosk, throw an error
    if (camera.streaming && camera.is_at_kiosk && camera.kioskId === kioskId)
      throw new ConflictException(KioskErrors.AlreadyAttached);

    // If camera was attached to a different kiosk, detach if from
    // that kiosk and attach to the current kiosk
    if (camera.streaming && camera.is_at_kiosk && camera.kioskId !== kioskId)
      await this.detachCamera(camera.kioskId, cameraId);

    await this.cameraStreamService.startKioskStream(camera);

    await this.cameraCrudService.updateCamera(camera, {
      streaming: true,
      is_at_kiosk: true,
      kiosk: {
        connect: { id: kiosk.id },
      },
    });

    return this.findOne({ id: kioskId });
  }

  /**
   * Disconnects a camera from kiosk destroying receiver stream,
   * so camera needs to be connected again to start detecting faces
   * @returns updated kiosk
   */
  async detachCamera(kioskId: number, cameraId: number) {
    const kiosk = await this.findOne({ id: kioskId });
    const camera = await this.cameraCrudService.findOne({
      id: cameraId,
      streaming: true,
      is_at_kiosk: true,
      kiosk: { id: kioskId },
    });

    await this.cameraStreamService.destroyStream(camera);

    await this.cameraCrudService.updateCamera(camera, {
      streaming: false,
      is_at_kiosk: false,
      kiosk: {
        disconnect: { id: kiosk.id },
      },
    });

    // just to return a actual kiosk
    return this.findOne({ id: kioskId });
  }

  /**
   * Removes a kiosk from the database
   * @throws {ConflictException} if camera is attached
   */
  async removeKiosk(where: Prisma.KioskWhereInput) {
    const kiosk = await this.findOne(where);
    const camera = await this.cameraCrudService
      .findOne({
        streaming: true,
        is_at_kiosk: true,
        kiosk: { id: kiosk.id },
      })
      .catch(() => null);

    if (camera) throw new ConflictException(KioskErrors.CameraIsAttached);

    return this.prisma.kiosk.delete({
      where: { id: kiosk.id },
    });
  }
}
