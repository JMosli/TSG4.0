import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Range } from '@prisma/client';
import net from 'net';
import { Netmask } from 'netmask';
import * as nodeOnvif from 'node-onvif-ts-extended';
import onvif, { Cam } from 'onvif/promises';
import { ConfigService } from 'src/config/config.service';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeService } from '../range/range.service';
import { CameraListChangeEvent } from './events/camera-list-change.event';
import {
  DetectionMetadata,
  OnvifAddress,
  OnvifCamera,
  OnvifCameraProbe,
  OnvifCredentials,
} from './types';

/**
 * Detects events when new devices appear or disappear from the network.
 */
@Injectable()
export class CameraProbeService {
  private readonly logger = new Logger(CameraProbeService.name);

  /**
   * This is set after startDiscovery to the return value
   * of setInterval
   */
  private discoveryInterval: NodeJS.Timeout = null;
  private subnetProbeInterval: NodeJS.Timeout = null;

  private range: Range;

  /**
   * UPnP discovery event hook of the `onvif` library
   * When new devices appear in the network, the "device" event
   * should be emitted here.
   */
  private onvifDiscovery: onvif.Discovery;

  /**
   * All cameras detected by UPnP requests will appear here
   * Key is ip address:port
   */
  public detectedCameras: Map<
    string,
    OnvifAddress & { updatedAt: Date; metadata?: DetectionMetadata }
  > = new Map();

  /**
   * All active cameras will appear here.
   * Key is ip address:port
   */
  public connectedCameras: Map<
    string,
    { cam: OnvifCamera; connection: [OnvifCameraProbe, nodeOnvif.OnvifDevice] }
  > = new Map();

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private readonly rangeService: RangeService,
    private readonly configService: ConfigService,
  ) {
    this.onvifDiscovery = onvif.Discovery as unknown as onvif.Discovery;
    this.startDiscovery();
  }

  /**
   * This function searches for cameras in all networks using UPnP device
   * probing method.
   *
   * It uses 2 onvif libraries to find cameras due to different envelope formats
   * in these 2 libraries and some cameras support only one of them.
   */
  async probeCameras() {
    /**
     * Contains all ip of all cameras in the network
     */
    const filteredCameras: Array<OnvifAddress> = [];

    const [onvifCameras, nodeOnvifCameras] = await Promise.all([
      this.onvifProbe(),
      nodeOnvif.startProbe(),
    ]);

    filteredCameras.push(
      ...onvifCameras.map((cam) => ({ ip: cam.hostname, port: +cam.port })),
    );

    /**
     * Urls of all node-onvif camera instances
     */
    // xaddrs[0] contains url of the service endpoint of the nodeOnvif camera
    // so we need to extract ip address from this camera
    const nodeOnvifUrls = nodeOnvifCameras.map((cam) => new URL(cam.xaddrs[0]));

    filteredCameras.push(
      // Searching for all entries in nodeOnvifCameras that are not
      // present in onvifCameras and adding these absent cameras into the
      // filtered cameras array
      ...nodeOnvifUrls
        .filter(
          (url) =>
            !onvifCameras.filter(
              (onvifCam) => onvifCam.hostname === url.hostname,
            ).length,
        )
        .map((url) => ({ ip: url.hostname, port: +url.port })),
    );

    // Updating detected cameras
    for (const cam of filteredCameras) {
      this.detectedCameras.set(this.getMapKey(cam), {
        ...cam,
        updatedAt: new Date(),
      });
    }

    // And then updating actual connected cameras
    await this.connectPool();

    // After connection attempt, remove actually disconnected cameras
    await this.removeInactive();
  }

  /**
   * Connects to camera trying all possible credentials
   * @param ip ip of the camera to connect to
   * @param port port of the onvif service
   * @returns camera connection or null if it was not successful
   */
  async connect(
    ip: string,
    port: number,
    credentials?: OnvifCredentials,
  ): Promise<[OnvifCameraProbe, nodeOnvif.OnvifDevice] | null> {
    const cameraPasswords = await this.configService.get<OnvifCredentials[]>(
      'camera.onvif.passwords',
      { throws: true },
    );

    /**
     * Connects to the specified camera with credentials
     * @returns [connection, isSuccessful]
     */
    const connect = (
      credentials: OnvifCredentials,
    ): Promise<[OnvifCameraProbe, nodeOnvif.OnvifDevice, boolean]> => {
      return new Promise(async (resolve) => {
        const connection = new Cam({
          ...credentials,
          hostname: ip,
          port,
        });
        const device = new nodeOnvif.OnvifDevice({
          xaddr: `http://${ip}:${port}/onvif/device_service`,
          user: credentials.username,
          pass: credentials.password,
        });

        // node-onvif sends too many requests, so I just
        // use this private method to get only most
        // necessary information about device to initialize it
        if (!device.services.ptz) {
          //@ts-expect-error
          await device.getCapabilities().catch(() => null);
        }

        // Typings on this library are not right
        connection.on('connect', () =>
          resolve([connection as OnvifCameraProbe, device, true]),
        );
        connection.on('error', () => {
          resolve([connection as OnvifCameraProbe, device, false]);
        });

        // I said that this library has wrong typings?
        //@ts-expect-error
        connection.connect((err, _, xml) => {
          if (err) {
            resolve([connection as OnvifCameraProbe, device, false]);
          }
        });
      });
    };

    // Before trying to connect to the camera, we need to probe it first
    // to find if port is even open
    const probe = await this.probeDevice(ip, port);
    if (!probe) return null;

    // If user specified a credentials, we dont need to probe them
    if (credentials) {
      const [connection, device, isSuccessful] = await connect(credentials);
      if (isSuccessful) return [connection, device];

      return null;
    }

    // Trying all credentials to connect to the specified camera
    for (const tryCredentials of cameraPasswords.value) {
      const [connection, device, isSuccessful] = await connect(tryCredentials);
      if (isSuccessful) return [connection, device];
    }

    return null;
  }

  /**
   * Probes one device to find if its a camera.
   * It looks if onvif port is open on the specified ip address
   * @returns if device is active or not
   */
  probeDevice(ip: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(3000);
      socket.setKeepAlive(false);
      socket.connect(port, ip, () => {
        // Connection established, so this device is
        // certainly a camera
        resolve(true);
        socket.destroy();
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      // We are waiting 1 second for camera to respond
      setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, 1000);
    });
  }

  /**
   * Goes through all ip addresses in the camera subnet
   * and searches for all devices with onvif port open.
   * @returns list of active ip addresses
   */
  public async subnetProbe(): Promise<Array<OnvifAddress>> {
    const subnet = new Netmask(this.range.camera_subnet);

    const ports = await this.configService.get<number[]>('camera.onvif.ports');
    if (!ports) {
      this.logger.warn(
        'could not probe subnet: camera.onvif.ports key not found',
      );
      return [];
    }

    // subnet library does not have any method to get just an array
    // of all ip addresses
    let ips = [];
    subnet.forEach((ip) => ips.push(ip));
    // Construct a full list of camera ip/port to try
    ips = ips
      .map((ip) => ({ ip, ports }))
      .map((ipPort) =>
        ipPort.ports.value.map((port) => ({ ip: ipPort.ip, port })),
      )
      .flat();

    // Getting map of booleans indicating all active and inactive devices in the network
    // [true, false, false, true] ...
    const activeIps = await Promise.all(
      ips.map(({ ip, port }) => this.probeDevice(ip, port)),
    );
    // Then assigning all trues to the matching ip from ips and all falses to null
    // [true, false, false, true] -> ["192.168.1.1", null, null, "192.168.1.4"]
    // then filtering out all null values to get just ip addresses
    const devices = activeIps
      .map((isActive, index) => (isActive ? ips[index] : null))
      .filter((ip) => !!ip);

    return devices;
  }

  /**
   * Probes cameras using `onvif` library.
   * Basically it just promisifies onvif probe method
   */
  private onvifProbe(): Promise<OnvifCameraProbe[]> {
    return new Promise((resolve) => {
      //@ts-expect-error
      this.onvifDiscovery.probe((err, cameras) => {
        if (err)
          return this.logger.error(
            'could not probe cameras: ' + err.toString(),
          );

        resolve(cameras);
      });
    });
  }

  /**
   * Removes all inactive cameras that are inactive for some time
   */
  private async removeInactive() {
    const inactiveTimeout = await this.configService.get<number>(
      'camera.inactive_timeout',
      { throws: true },
    );

    // Getting all cameras that are present in the detected cameras array
    // so they are likely to be connected to the network, but are not
    // authenticated.
    const inactiveCameras = [...this.detectedCameras].filter(
      ([ipPort, cam]) => !this.connectedCameras.get(ipPort),
    );

    // Getting all cameras that was updated long time ago
    const disconnectedCameras = inactiveCameras.filter(
      ([ip, cam]) =>
        Date.now() - cam.updatedAt.getTime() > inactiveTimeout.value,
    );

    // And just removing all disconnected cameras from the check pool
    for (const [ip, cam] of disconnectedCameras) {
      this.detectedCameras.delete(ip);
    }
  }

  /**
   * Gets all cameras from database and adds them into detectedCameras
   */
  private async getFromDb() {
    const cameras = await this.prisma.camera.findMany();

    // Cameras that are not in detectedCameras
    const filteredCameras = cameras
      .map((camera) => ({ ...camera, ip: camera.ip_address }))
      .filter((camera) => !this.detectedCameras.get(this.getMapKey(camera)));

    for (const camera of filteredCameras) {
      if (camera.connected) {
        this.connectedCameras.set(this.getMapKey(camera), {
          cam: {
            ...camera,
            metadata: {
              kioskId: camera.kioskId,
            },
          },
          connection: null,
        });
        continue;
      }

      this.detectedCameras.set(this.getMapKey(camera), {
        ip: camera.ip_address,
        port: camera.port,
        credentials: {
          password: camera.password,
          username: camera.username,
        },
        updatedAt: new Date(),
      });
    }

    this.logger.debug(`got ${filteredCameras.length} cameras from database`);
  }

  /**
   * Builds a string to use it as map key for detectedCameras or connectedCameras
   * @returns map key
   */
  public getMapKey(camera: OnvifAddress) {
    return `${camera.ip}:${camera.port}`;
  }

  /**
   * Called on every probe. Tries to connect to all cameras found on the network
   * to determine which are active and which are not
   */
  public async connectPool() {
    const newConnectedCameras: typeof this.connectedCameras = new Map(
      this.connectedCameras,
    );

    // Getting all detected cameras that became active
    const activeDetectedCameras: Array<
      [OnvifAddress, [OnvifCameraProbe, nodeOnvif.OnvifDevice] | null]
    > = await Promise.all(
      [...this.detectedCameras]
        .filter(([ipPort]) => !this.connectedCameras.get(ipPort))
        .map(async ([_, cam]) => [
          cam,
          await this.connect(cam.ip, cam.port, cam.credentials ?? undefined),
        ]),
    );

    // Getting all connected cameras that are still active
    const activeConnectedCameras: Array<
      [OnvifCamera, [OnvifCameraProbe, nodeOnvif.OnvifDevice] | null]
    > = await Promise.all(
      [...this.connectedCameras].map(async ([ipPort, cam]) => [
        cam.cam,
        (await cam.connection?.[1]?.services.device.getNTP().catch(() => null))
          ? cam.connection
          : null,
      ]),
    );

    const activeCameras = [...activeDetectedCameras, ...activeConnectedCameras];

    for (const [cam, connection] of activeCameras) {
      if (!connection) {
        // Camera was disconnected and we need to delete it from
        // connected cameras

        newConnectedCameras.delete(this.getMapKey(cam));
        continue;
      }

      const [conn, device] = connection;

      newConnectedCameras.set(this.getMapKey(cam), {
        cam: {
          ...cam,
          username: conn.username,
          password: conn.password,
        },
        connection,
      });
    }

    // Now getting added/removed cameras and firing events to notify other
    // parts of the system about state change

    const addedCameras = [...newConnectedCameras].filter(
      ([ipPort, cam]) => !this.connectedCameras.get(ipPort),
    );
    const removedCameras = [...this.connectedCameras].filter(
      ([ipPort, cam]) => !newConnectedCameras.get(ipPort),
    );

    if (addedCameras.length > 0) {
      this.eventEmitter.emit(
        'camera.added',
        new CameraListChangeEvent({
          changed: addedCameras.map(([ip, cam]) => cam),
        }),
      );
    } else if (removedCameras.length > 0) {
      this.eventEmitter.emit(
        'camera.removed',
        new CameraListChangeEvent({
          changed: removedCameras.map(([ip, cam]) => cam),
        }),
      );
    }

    this.connectedCameras = newConnectedCameras;
  }

  public async stopDiscovery() {
    clearInterval(this.subnetProbeInterval);
    clearInterval(this.discoveryInterval);

    this.subnetProbeInterval = null;
    this.discoveryInterval = null;
  }

  /**
   * Starts listening to multicast UPnP requests.
   * If discovery is already running, it does not do anything
   */
  public async startDiscovery() {
    const range = await this.rangeService.getDefault().catch(() => null);
    if (!range)
      return this.logger.warn(
        'could not start camera discovery: default range not found',
      );

    if (this.subnetProbeInterval || this.discoveryInterval) return;

    this.range = range;

    await this.getFromDb();

    //prettier-ignore
    const probeInterval = await this.configService.get<number>("camera.probe_interval");
    //prettier-ignore
    const subnetProbeInterval = await this.configService.get<number>('camera.subnet_probe_interval');

    if (!probeInterval || !subnetProbeInterval)
      return this.logger.warn(
        'could not start camera discovery: config values were not found',
      );

    // Cameras can send Hello request (https://specs.xmlsoap.org/ws/2005/04/discovery/ws-discovery.pdf)
    // but both libraries do not support this kind of discovery, so I just made
    // this shit to pool cameras once in a while
    this.discoveryInterval = setInterval(
      this.probeCameras.bind(this),
      probeInterval.value,
    );

    // I know this is strange, but my camera just does
    // not get detected without the directed probe
    this.subnetProbeInterval = setInterval(
      this.subnetProbe.bind(this),
      subnetProbeInterval.value,
    );

    this.probeCameras();
    this.subnetProbe();

    this.logger.debug('camera discovery started');
  }
}
