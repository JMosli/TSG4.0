import _tf from '@tensorflow/tfjs-node';
import Human, { Config } from '@vladmandic/human';
import Ffmpeg, { FfmpegCommand, ffprobe, FfprobeData } from 'fluent-ffmpeg';
import { BINARIES } from 'src/setup/constants';
import { PassThrough } from 'stream';
import { detectionSettings, MODELS_PATH } from './constants';
import { KioskFaceDetectParams } from './kiosk-detection/types';
import { LaneFaceDetectParams } from './lane-detection/types';

/**
 * Returns options for fast face detection
 */
export const getFaceDetectionOptions = (
  face: Partial<Config['face']> = {},
): Partial<Config> => ({
  async: true,
  softwareKernels: true,
  face: {
    enabled: true,
    detector: { rotation: false, return: false, minSize: 100 },
    emotion: { enabled: false },
    description: { enabled: false },
    attention: { enabled: false },
    antispoof: { enabled: false },
    gear: { enabled: false },
    liveness: { enabled: false },
    iris: { enabled: false },
    ...face,
  },
  segmentation: { enabled: false },
  body: { enabled: false },
  hand: { enabled: false },
  gesture: { enabled: false },
  object: { enabled: false },
  filter: { enabled: false },
  deallocate: true,
});

/**
 * Returns options for face recognition training or similarity detection
 */
export const getFaceRecognitionOptions = (
  face: Partial<Config['face']> = {},
): Partial<Config> =>
  getFaceDetectionOptions({
    description: { enabled: true },
    mesh: { enabled: true },
    detector: {
      rotation: true,
      return: true,
      iouThreshold: 0.01,
      minConfidence: 0.2,
    },
  });

/**
 * Initializes faceapi and canvas and other things
 */
export async function prepare(): Promise<{ tf: typeof _tf; human: Human }> {
  // Loading models
  const human = new Human({
    modelBasePath: `file://${MODELS_PATH}`,
  });

  return { tf: human.tf, human };
}

export async function prepareStream(
  payload: LaneFaceDetectParams | KioskFaceDetectParams,
) {
  Ffmpeg.setFfprobePath(BINARIES.ffprobe);
  const streamInfo = await getStreamInfo(payload.streamURI);
  // this will fail if there was an error, but it is okay
  const videoStream = streamInfo.streams.find((s) => s.codec_type === 'video');

  console.log(videoStream);

  // specifying a crop
  // if it is not defined, it will just select
  // the largest crop possible
  const crop = payload.camera.config?.crop ?? [
    0,
    0,
    videoStream.width ?? 1920,
    videoStream.height ?? 1080,
  ];
  crop[2] = Math.min(crop[2], videoStream.width);
  crop[3] = Math.min(crop[3], videoStream.height);

  // just for convenience
  const detectionConfig = {
    useLiveModel: payload.config.liveModel,
    scaleFactor: payload.config.scaleFactor,
    minFaceSize: {
      width: payload.config.minFaceSize[0],
      height: payload.config.minFaceSize[1],
    },
  };

  // starting an ffmpeg stream
  const [ffmpegCommand, videoPipe] = retrieveVideoStream(
    payload.streamURI,
    crop,
    payload.camera.config.scale ?? 1,
    payload.camera.config.rotation ?? 0,
  );

  // determining the fps we need to use
  const frameInterval = payload.camera.config.fps
    ? Math.round(1000 / payload.camera.config.fps / 2)
    : detectionSettings.FRAME_INTERVAL;

  // determining video width and height with scaling
  // and also determining a frame size in bytes (that is vw * vh * N_ch)
  // N_ch is a number of channels and it is 1 due to gray pixel format in ffmpeg
  const aspect = crop[2] / crop[3];
  const vw = crop[2] / (payload.camera?.config?.scale ?? 1);
  const vh = vw / aspect;

  const dims = {
    aspect,
    w: vw,
    h: vh,
    bytes: vw * vh,
  };

  return {
    crop,
    detectionConfig,
    ffmpegCommand,
    videoPipe,
    frameInterval,
    dims,
  };
}

/**
 * Creates a tensor to load into the tensorflow face detection
 * function from file buffer
 * @param file file path
 */
export async function getTensor(buffer: Buffer, tf: typeof _tf) {
  const tensor = tf.tidy(() => {
    const decode = tf.node.decodeImage(buffer, 3);
    let expand;
    if (decode.shape[2] === 4) {
      // input is in rgba format, need to convert to rgb
      const channels = tf.split(decode, 4, 2); // tf.split(tensor, 4, 2); // split rgba to channels
      const rgb = tf.stack([channels[0], channels[1], channels[2]], 2); // stack channels back to rgb and ignore alpha
      expand = tf.reshape(rgb, [1, decode.shape[0], decode.shape[1], 3]); // move extra dim from the end of tensor and use it as batch number instead
    } else {
      expand = tf.expandDims(decode, 0); // input ia rgb so use as-is
    }
    const cast = tf.cast(expand, 'float32');
    return cast;
  });

  // The contents of this function can be anything, even creating
  // a canvas, but we still need a way to dispose anything created here
  return {
    getTensor: () => tensor,
    dispose: () => tensor.dispose(),
  };
}

/**
 * Runs an ffmpeg process to retrieve video frames
 */
export function retrieveVideoStream(
  stream: string,
  crop: number[],
  scaleFactor = 1,
  rotation = 0,
): [FfmpegCommand, PassThrough] {
  const videoPipe = new PassThrough();

  //prettier-ignore
  const ffmpeg = Ffmpeg(stream)
    .inputOptions([
      '-fflags', 'nobuffer',
      '-flags', 'low_delay',
      "-strict", "experimental",
      "-rtsp_transport", "tcp",
      // "-rtsp_flags", "listen",
      "-probesize", "32"
    ])
    .outputOptions([
      "-pix_fmt", "gray",
      "-vcodec", "rawvideo",
      "-f", "rawvideo",
      '-vf', `crop='min(${crop[2]},iw)':'min(${crop[3]},ih)':${crop[0]}:${crop[1]},` + 
             `scale='iw/${scaleFactor}:-1'` + 
             (rotation != 0 ? `,rotate=${rotation} * PI/180` : ""),
      "-an",
      "-sws_flags", "fast_bilinear",
      '-threads', "1"
    ])
    .output(videoPipe)
    .on("start", console.error)

  ffmpeg.run();

  return [ffmpeg, videoPipe];
}

export function getStreamInfo(stream: string) {
  return new Promise<FfprobeData | undefined>((resolve) =>
    ffprobe(stream, (err, data) => (err ? console.error(err) : resolve(data))),
  );
}
