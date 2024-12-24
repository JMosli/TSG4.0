import _tf from '@tensorflow/tfjs-node';
import fs from 'fs/promises';
import path from 'path';
import * as WorkerEngine from 'shinobi-worker';
import { WorkerStart } from 'src/camera/utils/worker.types';
import {
  getFaceRecognitionOptions,
  getTensor,
  prepare,
} from '../human-utils.tools';
import { FaceTrainParams, FaceTrainResult } from './types';

const parentPort = WorkerEngine.buildParentPort({
  json: true,
  debug: true,
});

export async function worker(payload: FaceTrainParams) {
  const { human, tf } = await prepare();

  // These are just magic numbers
  const CLAMP_MAX_COEF = 0.05;
  const SPEED = 0.001;

  // The idea is to gradually decrease speed of raising a number
  // of faces selected for training as total number increases.
  // To do that, I am using the Sigmoid function and changing
  // the coefs to match the expected behavior.

  // The magic numbers are selected carefully to do their job
  const sigf = (x: number) => 1 / (1 + Math.exp(x));
  const take = (index: number, length: number) =>
    index % Math.round(CLAMP_MAX_COEF * length * sigf(-SPEED * length)) === 0;

  // Getting all images in the face directory
  const images = await fs
    .readdir(payload.faceDirectory, { withFileTypes: true })
    .then((items) => items.filter((item) => !item.isDirectory())) // getting only files
    .then((items) =>
      items.length > 60
        ? items.filter((_, index) => take(index, items.length))
        : items,
    ); // getting every nth value if number of faces is bigger than 60

  // As it can contain unrecognizable faces, we need to filter out only
  // images with faces
  const detections = await Promise.all(
    images.map(async (file) => {
      const buffer = await fs.readFile(
        path.resolve(payload.faceDirectory, file.name),
      );

      // checking if buffer is properly encoded png file
      if (buffer[0] != 0x89 || buffer.subarray(1, 4).toString() !== 'PNG')
        return;

      const tensor = await getTensor(buffer, tf as typeof _tf).catch(
        () => null,
      );
      if (!tensor) return;

      // Getting all descriptions of the face
      const detections = await human.detect(
        tensor.getTensor(),
        getFaceRecognitionOptions(),
      );

      tensor.dispose();

      if (!detections.face.length) return null;

      return { detection: detections.face.at(0), file };
    }),
  );

  // Filtering out undetected faces
  const faces = detections.filter((detection) => !!detection);

  // Build a model to predict features from the faces
  const model = faces.map((result) => result.detection.embedding);

  await fs.writeFile(payload.saveMatcherTo, JSON.stringify(model));

  emit('face_recognizer.train.finished', {
    matched: faces.length,
  });

  process.exit();
}

/**
 * Sends an event message to the parent port
 */
function emit(event: string, payload: FaceTrainResult) {
  parentPort.postMessage({
    event,
    data: payload,
  });
}

parentPort.once('message', (data: WorkerStart<FaceTrainParams>) => {
  if (data.action === 'start') {
    worker(data.data);
  }
});
