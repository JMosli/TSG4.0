import { ConflictException, Injectable } from '@nestjs/common';
import { CameraCrudService } from 'src/camera/camera-crud.service';
import { CameraStreamService } from 'src/camera/stream.service';
import { PrismaService } from 'src/helpers/prisma.service';
import { LaneErrors } from './constants';

@Injectable()
export class LaneService {
  constructor(
    private prisma: PrismaService,
    private readonly cameraCrudService: CameraCrudService,
    private readonly cameraStreamService: CameraStreamService,
  ) {}

  /**
   * Starts face detection job and updates camera in the database
   * detaching camera from kiosk and marking it as streaming
   * @param lane lane name
   * @param cameraId id of the camera to connect to the lane
   * @returns updated camera
   * @throws {ConflictException} if camera is attached to a kiosk or to the same lane
   * or different camera is attached to the same lane
   */
  async attachCamera(lane: string, cameraId: number) {
    const camera = await this.cameraCrudService.findOne({ id: cameraId });
    const attached = await this.cameraCrudService.findOne(
      { lane_name: lane },
      false,
    );

    if (attached)
      throw new ConflictException(LaneErrors.DifferentCameraAttached);

    // If it is attached to the kiosk, we dont detach it from kiosk,
    // but just ask user to do it manually
    if (camera.is_at_kiosk && camera.streaming)
      throw new ConflictException(LaneErrors.CameraIsAttached);

    // If user tries to attach camera to the same lane,
    // throw an error
    if (camera.streaming && camera.lane_name === lane)
      throw new ConflictException(LaneErrors.AlreadyAttached);

    // We need to detach camera from previous stream if it was attached
    if (camera.streaming && camera.lane_name !== lane)
      await this.detachCamera(camera.lane_name, cameraId);

    await this.cameraStreamService.startLaneStream(camera);

    return this.prisma.camera.update({
      where: { id: camera.id },
      data: {
        lane_name: lane,
        streaming: true,
        is_at_kiosk: false,
        kiosk: camera.kioskId
          ? {
              disconnect: {
                id: camera.kioskId,
              },
            }
          : undefined,
      },
    });
  }

  /**
   * Disconnects a camera from a lane, destroying face detection
   * job, so user will need to start it again
   * @param lane lane name
   * @param cameraId id of the camera to detach from the lane
   * @returns updated camera
   */
  async detachCamera(lane: string, cameraId: number) {
    const camera = await this.cameraCrudService.findOne({
      id: cameraId,
      lane_name: lane,
      is_at_kiosk: false,
    });
    await this.cameraStreamService.destroyStream(camera);

    return this.prisma.camera.update({
      where: { id: camera.id },
      data: {
        lane_name: null,
        streaming: false,
      },
    });
  }
}
