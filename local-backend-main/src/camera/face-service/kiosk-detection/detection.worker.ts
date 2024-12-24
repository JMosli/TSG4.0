import _tf from '@tensorflow/tfjs-node';
import cv from '@u4/opencv4nodejs';
import { Console } from 'console';
import { randomInt } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import * as WorkerEngine from 'shinobi-worker';
import { CameraContext } from 'src/camera/types';
import { WorkerStart } from 'src/camera/utils/worker.types';
import { setupSettings } from 'src/setup/constants';
import { detectionSettings } from '../constants';
import { detectFaces, processFrame } from '../face-utils.tools';
import { prepare, prepareStream } from '../human-utils.tools';
import { FaceKioskDetectDataEvent, KioskFaceDetectParams } from './types';

const console = new Console(process.stderr);
const parentPort = WorkerEngine.buildParentPort({
  json: true,
  debug: true,
});

async function worker(payload: KioskFaceDetectParams) {
  console.error('start detection');
  const { human, tf } = await prepare();
  const { crop, detectionConfig, frameInterval, videoPipe, dims } =
    await prepareStream(payload);

  const targetWidth = payload.camera?.config?.targetWidth ?? 1200;
  const faceClassifier = new cv.CascadeClassifier(cv[payload.config.classifier]);

  if (detectionSettings.DEBUG_WINDOWS) new cv.namedWindow('image_k');

  let faceSequence: Array<Buffer> = [];
  let framesWithoutFaces = 0;
  let personOnKiosk = false;

  const reset = () => {
    personOnKiosk = false;
    framesWithoutFaces = 0;
    faceSequence = [];
  };

  // Waiting some time to reset personOnKiosk
  // because kiosk would probably have queue and we dont
  // want to let client select lane by himself
  setTimeout(reset, payload.config.timeout);

  setInterval(async () => {
    const rawFrame: Buffer = videoPipe.read(dims.bytes);
    if (!rawFrame) return;
    if (rawFrame.length !== dims.bytes) return;

    const frame = new cv.Mat(dims.h, dims.w, cv.CV_8UC1, rawFrame);

    const { img, releaseImages } = await processFrame(
      frame,
      [crop[0], crop[1], dims.w, dims.h],
      targetWidth,
    );
    let [frontalFaces, buffer] = await detectFaces(
      img,
      human,
      faceClassifier,
      detectionConfig,
      tf as typeof _tf,
    );

    if (frontalFaces.length) {
      if (faceSequence.length > 10) framesWithoutFaces = 0;
    } else {
      framesWithoutFaces++;
      faceSequence = [];
    }

    for (const face of frontalFaces) {
      if (!buffer) buffer = await cv.imencodeAsync('.png', img);
      faceSequence.push(buffer);

      if (detectionSettings.DEBUG_WINDOWS) cv.drawDetection(img, face);
    }

    // If client appeared on the camera, we are saving faces
    // into the filesystem and sending faceSequence to the main
    // thread for face recognition
    if (faceSequence.length >= payload.config.startFaces && !personOnKiosk) {
      personOnKiosk = true;
      sendFaces(payload.camera, faceSequence);
    }

    // If client left a kiosk, we just resetting personOnKiosk
    // to start detection again
    if (framesWithoutFaces >= payload.config.maxNoFaces && personOnKiosk) {
      reset();
    }

    if (detectionSettings.DEBUG_LOGS)
      console.error(
        `fwf ${framesWithoutFaces} | fs ${faceSequence.length} | pok ${personOnKiosk}`,
      );

    if (detectionSettings.DEBUG_WINDOWS) {
      cv.imshow('image_k', img);
      cv.waitKey(1);
    }

    frame.release();
    releaseImages();
  }, frameInterval);
}

/**
 * Sends file paths to the main thread
 */
async function sendFaces(camera: CameraContext, faces: Buffer[]) {
  emit('face_detect_kiosk.detected', {
    imagesDirectory: await saveFaces(camera.id, faces),
    camera,
  });
}

/**
 * Saves a list of buffer to the filesystem generating file names and
 * creating directory.
 * @returns directory path where all faces are located
 */
async function saveFaces(cameraId: number, faces: Buffer[]) {
  // Creating directory for all faces to be stored in
  const dirPath = path.resolve(
    setupSettings.KIOSK_IMAGES_PATH,
    `fd_${cameraId}_${Date.now()}_${randomInt(9999)}`,
  );

  await fs.mkdir(dirPath);

  // Generating image paths
  const imagePaths: Array<[Buffer, string]> = faces.map((buffer, index) => {
    const filePath = path.resolve(dirPath, `f_${index}.png`);
    return [buffer, filePath];
  });

  // Creating all files at the same time
  await Promise.all(
    imagePaths.map(([buffer, path]) => fs.writeFile(path, buffer)),
  );

  console.error('saved');
  return dirPath;
}

function emit(event: string, payload: FaceKioskDetectDataEvent) {
  parentPort.postMessage({
    event,
    data: payload,
  });
}

parentPort.once('message', (data: WorkerStart<KioskFaceDetectParams>) => {
  if (data.action === 'start') {
    worker(data.data);
  }
});
