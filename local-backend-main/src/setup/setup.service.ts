import { ConflictException, Injectable, Logger } from '@nestjs/common';
import Ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import {
  cameraPasswords,
  cameraSettings,
  streamSettings,
} from 'src/camera/constants';
import {
  detectionSettings,
  recognitionSettings,
} from 'src/camera/face-service/constants';
import { CameraProbeService } from 'src/camera/probe.service';
import { GlobalServerService } from 'src/global-server/global-server.service';
import { uiSettings } from 'src/kiosk/constants';
import { priceOptions } from 'src/payment/constants';
import { CreateRangeDto } from 'src/range/dto/create-range.dto';
import { RangeService } from 'src/range/range.service';
import { ConfigService } from '../config/config.service';
import { BINARIES, SetupErrors, setupSettings } from './constants';

@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);

  constructor(
    private readonly rangeService: RangeService,
    private readonly globalServerService: GlobalServerService,
    private readonly probeService: CameraProbeService,
    private readonly configService: ConfigService,
  ) {
    this.init();
  }

  async init() {
    const configExists = await this.isConfigPresent();
    if (!configExists)
      this.logger.error(
        'config not present in the database, please create it by doing POST /setup/config',
      );

    Ffmpeg.setFfprobePath(BINARIES.ffprobe);
  }

  /**
   * Creates all needed directories for system to operate
   */
  async createDirectories() {
    await fs.mkdir(setupSettings.SYSTEM_PATH).catch(() => null);
    await fs.mkdir(setupSettings.USERDATA_PATH).catch(() => null);
    await fs.mkdir(setupSettings.TEMP_PATH).catch(() => null);
    await fs.mkdir(setupSettings.CLIENTS_PATH).catch(() => null);
    await fs.mkdir(setupSettings.KIOSK_IMAGES_PATH).catch(() => null);
    await fs.mkdir(setupSettings.RECORDING_PATH).catch(() => null);

    return { ok: true };
  }

  /**
   * Sets all default values for config in database
   */
  async setupConfig(reset = true) {
    const set = async (
      name: string,
      value: any,
      mustReboot: boolean = false,
    ) => {
      if (reset)
        return this.configService.set(name, value, {
          mustReboot,
          system: true,
        });

      const entry = await this.configService.get(name, { logError: false });
      if (!entry)
        await this.configService.set(name, value, { mustReboot, system: true });
    };

    // prettier-ignore
    await Promise.all([
      set('camera.probe_interval', cameraSettings.PROBE_INTERVAL, true),
      set('camera.subnet_probe_interval', cameraSettings.SUBNET_PROBE_INTERVAL, true),
      set('camera.inactive_timeout', cameraSettings.INACTIVE_TIMEOUT, true),
      set('camera.disconnected_db_remove', cameraSettings.DISCONNECTED_DB_REMOVE),
      set('camera.disconnected_retry_interval', cameraSettings.DISCONNECTED_RETRY_INTERVAL, true),
      set('camera.remove_face_interval', cameraSettings.REMOVE_FACE_INTERVAL, true),
      set('camera.remove_garbage_interval', cameraSettings.REMOVE_GARBAGE_INTERVAL, true),

      set('camera.stream.silence_db', streamSettings.SILENCE_DB),
      set('camera.stream.sound_peak_record_delta', streamSettings.SOUND_PEAK_RECORD_DELTA),
        
      set('camera.onvif.ports', cameraSettings.ONVIF_PORTS),
      set("camera.onvif.passwords", cameraPasswords),

      set("camera.detection.lane.min_start_faces", detectionSettings.MIN_START_FACES),
      set("camera.detection.lane.max_frames_without_faces", detectionSettings.MAX_FRAMES_WITHOUT_FACES),
      set("camera.detection.lane.min_faces", detectionSettings.MIN_FACES),
      set("camera.detection.lane.classifier", "HAAR_FRONTALFACE_ALT2"),

      set("camera.detection.kiosk.min_start_faces", detectionSettings.MIN_KIOSK_START_FACES),
      set("camera.detection.kiosk.session_timeout", detectionSettings.KIOSK_SESSION_TIMEOUT),
      set("camera.detection.kiosk.max_frames_without_faces", detectionSettings.MAX_FRAMES_WITHOUT_FACES),
      set("camera.detection.kiosk.classifier", "HAAR_FRONTALFACE_ALT2"),

      set("camera.detection.min_face_size", detectionSettings.MIN_FACE_SIZE),
      set("camera.detection.use_live_model_detection", detectionSettings.USE_LIVE_MODEL_DETECTION),
      set("camera.detection.multiscale_scale_factor", 1.4),

      set("camera.recognition.similarity_level", recognitionSettings.SIMILARITY_LEVEL),
      set("camera.recognition.workers_num", recognitionSettings.CLIENT_RECOGNITION_WORKERS_NUM),
      set("camera.recognition.faces_to_recognize", recognitionSettings.NUMBER_FACES_TO_RECOGNIZE),

      set("payment.video.base_price", priceOptions.BASE_VIDEO_PRICE),
      set("payment.video.duration_coef", priceOptions.VIDEO_DURATION_COEF),
      set("payment.photo.base_price", priceOptions.BASE_PHOTO_PRICE),
      set("payment.email.thank_you_text", "Thank you for purchase. You can access your items by clicking this link: {link}"),
      
      set("ui.kiosk.logo", "data:image/png;base64,iV"),
      set("ui.kiosk.thank_you.title", "Thank you title"),
      set("ui.kiosk.thank_you.description", "Thank you description"),

      set("ui.kiosk.poll", uiSettings.POLL),
      set("ui.kiosk.poll.enabled", false),

      set("ui.kiosk.payment.go_back_timeout", 60),
      set("ui.kiosk.display.photo_after_video", 2),
      set("ui.kiosk.display.card_size", "332px"),

      set("ui.tv.display.photo_after_video", 2),
    ]);

    return { ok: true };
  }

  /**
   * Returns if config is present in the database
   */
  async isConfigPresent() {
    const c = this.configService;

    const values = await Promise.all([
      c.get<number>('camera.probe_interval'),
      c.get<number>('camera.disconnected_db_remove'),
      c.get<string>('camera.stream.silence_db'),
      c.get<number[]>('camera.onvif.ports'),
      c.get<number>('camera.detection.lane.min_start_faces'),
      c.get<number>('camera.detection.kiosk.min_start_faces'),
      c.get<string>('camera.detection.kiosk.classifier'),
      c.get<string>('camera.detection.lane.classifier'),
      c.get<number>('camera.recognition.similarity_level'),
      c.get<number>('payment.video.base_price'),
    ]);

    const numNotFound = values.filter((value) => !!!value);

    return numNotFound.length === 0;
  }

  /**
   * Creates new default range.
   * Note: does not create range if default range already exist.
   *
   * @returns created range
   * @throws {ConflictException} if default range exists
   */
  async setupRange(payload: CreateRangeDto) {
    const range = await this.rangeService.getDefault().catch(() => null);
    if (range) throw new ConflictException(SetupErrors.RangeAlreadyExist);

    // Firstly, default setup config
    await this.setupConfig();

    const createdRange = await this.rangeService.createRange(payload, true);

    // At this point default range is available and we can create communicator
    // to sign and check global server requests
    await this.globalServerService.createCommunicator();

    // We assume that client just installed raw pc on the range and we also need
    // to setup all other things for system to operate as required
    await this.createDirectories();

    // And then just start a camera discovery
    // (as it's not started when no range exists)
    this.probeService.startDiscovery();

    this.logger.log('setup range finished successfully');

    return createdRange;
  }
}
