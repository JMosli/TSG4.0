import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import fs from 'fs/promises';
import path from 'path';
import { ClientService } from 'src/client/client.service';
import { ConfigService } from 'src/config/config.service';
import { GlobalServerService } from 'src/global-server/global-server.service';
import { PrismaService } from 'src/helpers/prisma.service';
import { rmdir } from 'src/helpers/utils';
import { setupSettings } from 'src/setup/constants';
import { CameraCrudService } from './camera-crud.service';
import { readdir } from './face-service/detection-common.utils';
import { CameraProbeService } from './probe.service';

/**
 * Makes some scheduling stuff like checking and removing disconnected
 * cameras, etc...
 */
@Injectable()
export class CameraScheduleService {
  private readonly logger = new Logger(CameraScheduleService.name);

  constructor(
    private prisma: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
    private readonly cameraService: CameraCrudService,
    private readonly probeService: CameraProbeService,
    private readonly configService: ConfigService,
    private readonly clientService: ClientService,
    private readonly globalService: GlobalServerService,
  ) {
    this.init();
  }

  /**
   * Gets all values from config and initializes scheduling tasks
   */
  async init() {
    let [disconnRetryInterval, removeFaceInterval, removeGarbageInterval] =
      await this.configService.getMany<[number, number, number]>([
        'camera.disconnected_retry_interval',
        'camera.remove_face_interval',
        'camera.remove_garbage_interval',
      ]);

    if (!disconnRetryInterval || !removeFaceInterval || !removeGarbageInterval)
      return this.logger.error('Could not run scheduled camera actions!');

    disconnRetryInterval.value = disconnRetryInterval.value * 1000;
    removeFaceInterval.value = removeFaceInterval.value * 1000;
    removeGarbageInterval.value = removeGarbageInterval.value * 1000;

    this.schedulerRegistry.addInterval(
      'disconnected_retry',
      setInterval(
        this.retryDisconnectedCameras.bind(this, disconnRetryInterval.value),
        disconnRetryInterval.value,
      ),
    );

    this.schedulerRegistry.addInterval(
      'remove_face',
      setInterval(
        this.removeFaces.bind(this, removeFaceInterval.value),
        removeFaceInterval.value,
      ),
    );

    this.schedulerRegistry.addInterval(
      'remove_garbage',
      setInterval(
        this.removeGarbage.bind(this, removeGarbageInterval.value),
        removeGarbageInterval.value,
      ),
    );

    this.logger.debug('initialized all camera scheduling tasks');
  }

  /**
   * When camera is removed, system marks a camera as disconnected
   * and does not remove it from the database. This crontab task
   * removes disconnected cameras from the database completely.
   */
  @Cron('0 0 * * *')
  async removeDisconnectedCameras() {
    const removeTime = await this.configService
      .get<number>('camera.disconnected_db_remove')
      .then((v) => v.value);

    const cameras = await this.cameraService.find({
      connected: false,
      disconnectedAt: {
        lt: new Date(Date.now() - removeTime),
      },
    });

    const removed = await this.cameraService.removeCameras({
      id: {
        in: cameras.map((c) => c.id),
      },
    });

    if (removed.count > 0) {
      await this.globalService.communicator.mailing.sendOwnersMessage({
        message:
          `Camera module just noticed that following ${removed.count} cameras has` +
          ` been inactive for ${Math.round(removeTime / 1000 / 60 / 60)} hours:\n\n` +
          cameras.map((c) => `${c.id} | ${c.ip_address}:${c.port}`).join('\n'),
        title: 'Inactive devices warning',
      });
    }

    this.logger.debug(`Removed ${removed.count} disconnected cameras`);
  }

  /**
   * When cameras are marked disconnected, we also want to try to
   * reconnect them once in a while, so this is want we are doing here.
   */
  async retryDisconnectedCameras() {
    this.logger.debug(`trying to reconnect disconnected devices`);

    const disconnected = await this.cameraService.find({
      connected: false,
    });

    // Just a map of booleans indicating active and non-active cameras
    const activeMap = await Promise.all(
      disconnected.map(async (cam) => {
        return this.probeService.probeDevice(cam.ip_address, cam.port);
      }),
    );

    // Only active cameras
    const active = activeMap.filter((active) => active);

    if (active.length) {
      // So if even one camera seems active, we really want to try
      // to probe all network to find it

      // Probing network before probing cameras using connect()
      // gives the best result
      await this.probeService.subnetProbe();
      await this.probeService.probeCameras();
    }
  }

  /**
   * Removes old clients who are probably left
   */
  async removeFaces(interval: number) {
    this.logger.debug(`removing old faces`);

    const clients = await this.clientService.find({
      createdAt: {
        lt: new Date(Date.now() - interval),
      },
    });

    // Removing database entry and client's directory
    // This will also remove all videos in the database
    for (const client of clients.items) {
      await this.clientService.removeClient(client.id, true).catch(() => null);
    }

    // Then deleting all old directories (because database may corrupt)
    // and so system never deletes user if he isnt in database

    const directories = await fs
      .readdir(setupSettings.CLIENTS_PATH, { withFileTypes: true })
      .then((items) => items.filter((item) => item.isDirectory()));

    for (const directory of directories) {
      const fullPath = path.resolve(directory.parentPath, directory.name);
      const stat = await fs.stat(fullPath);

      if (stat.birthtime.getTime() < Date.now() - interval) {
        await rmdir(fullPath);
      }
    }
  }

  /**
   * Removes all temporary stuff that is not needed for system to operate
   */
  async removeGarbage(interval: number) {
    const kioskFolders = await readdir(setupSettings.KIOSK_IMAGES_PATH);

    for (const kioskFolder of kioskFolders) {
      const stat = await fs.stat(kioskFolder);
      if (stat.birthtime.getTime() < Date.now() - interval) {
        await rmdir(kioskFolder);
      }
    }
  }
}
