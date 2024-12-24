import _tf from '@tensorflow/tfjs-node';
import cv, { CascadeClassifier, Mat, Rect } from '@u4/opencv4nodejs';
import Human, { Result } from '@vladmandic/human';
import { Size } from '../types';
import { getFaceDetectionOptions, getTensor } from './human-utils.tools';

/**
 * Detects a face in the image using one of two methods.
 * Method selection is being done through setting USE_LIVE_MODEL_DETECTION constant
 *
 * we can also use this, but i dont have time to implement this
 * https://github.com/ShiqiYu/libfacedetection/blob/master/COMPILE.md#linux-or-ubuntu
 */
export async function detectFaces(
  img: Mat,
  human: Human,
  faceClassifier: CascadeClassifier,
  config: {
    useLiveModel: boolean;
    minFaceSize: Size;
    scaleFactor: number
  },
  tf: typeof _tf,
): Promise<[Rect[], Buffer | null]> {
  if (config.useLiveModel) {
    const buffer = cv.imencode('.png', img);
    const tensor = await getTensor(buffer, tf);
    const frontalFaces: Result | null = await human
      .detect(tensor.getTensor(), getFaceDetectionOptions())
      .catch(() => null);
    tensor.dispose();
    if (!frontalFaces) return [null, buffer];

    return [frontalFaces.face.map((face) => new cv.Rect(...face.box)), buffer];
  } else {
    const frontalFaces = await faceClassifier.detectMultiScaleAsync(
      img,
      config.scaleFactor, // This helps to optimize a process significantly
      3, // Also helps to optimize about 20% of processor time
      0,
      new cv.Size(config.minFaceSize.width, config.minFaceSize.height), // Dramatically optimizes classifying process
    );

    return [frontalFaces.objects, null];
  }
}

/**
 * Processes a single frame from the camera to optimize
 * it for face detection getting region from camera, rescaling it
 * and getting bw version of an image
 */
export async function processFrame(
  frame: Mat,
  region: [number, number, number, number] = [0, 0, 1920, 1080],
  targetWidth: number = 1200
) {
  const regionRect = new cv.Rect(
    Math.min(region[0], frame.cols),
    Math.min(region[1], frame.rows),
    Math.min(region[2], frame.cols - region[0]),
    Math.min(region[3], frame.rows - region[1]),
  );

  const reg = frame.getRegion(regionRect);
  const img = await reg.resizeToMaxAsync(targetWidth);
  // const img = await sc.bgrToGrayAsync();

  return {
    releaseImages: () => {
      reg.release();
      img.release();
    },
    img,
  };
}
