import _tf from '@tensorflow/tfjs-node';
import cv, { Rect } from '@u4/opencv4nodejs';
import { Mutex } from 'async-mutex';
import fs from 'fs/promises';
import path from 'path';
import * as WorkerEngine from 'shinobi-worker';
import { WorkerStart } from 'src/camera/utils/worker.types';
import { wait } from 'src/helpers/utils';
import { FaceDetectDataEvent } from '../../events/face-detect-start.event';
import { detectionSettings } from '../constants';
import { detectFaces, processFrame } from '../face-utils.tools';
import { prepare, prepareStream } from '../human-utils.tools';
import { FaceDetectHostEvent, LaneFaceDetectParams } from './types';

type FaceDetectResult = Array<{ face: Rect; img: Buffer }> | null;

const parentPort = WorkerEngine.buildParentPort({
  json: true,
  debug: true,
});

/**
 * Variables that change throughout entire execution
 */
let globals = {
  saveTo: '',
};

async function worker(payload: LaneFaceDetectParams) {
  const { human, tf } = await prepare();
  const {
    crop,
    detectionConfig,
    ffmpegCommand,
    frameInterval,
    videoPipe,
    dims,
  } = await prepareStream(payload);

  const targetWidth = payload.camera?.config?.targetWidth ?? 1200;
  const takeEachFrame = (payload.camera?.config?.skipNFrames ?? 1) + 1;
  const faceClassifier = new cv.CascadeClassifier(cv[payload.config.classifier]);

  if (detectionSettings.DEBUG_WINDOWS) new cv.namedWindow('image');

  const faces = await new Promise<FaceDetectResult>(async (resolve) => {
    /** Contains all detected faces */
    let faces: Array<{ face: Rect; img: Buffer }> = [];
    let iteration = 0;

    /**
     * Contains only faces that was detected in one take without
     * frames with no faces.
     */
    let faceSequence: typeof faces = [];

    /** How many frames are currently was without faces */
    let framesWithoutFaces = 0;

    /** If true, then face_detect.start is already sent */
    let personInLane = false;
    let ended = false;

    const checkListMutex = new Mutex();
    const resolveMutex = new Mutex();

    const interval = setInterval(async () => {
      // Getting a raw image from the camera
      // flipping it vertically, getting the entire
      // region of the video stream (needed for cameras with 2 streams merged),
      // rescaling it to the half of the size,
      // and making it black and white.
      // All this stuff is needed for face detection to be as optimized
      // as it can possibly be

      // And also I dont know why just chaining calls gives
      // enormous memory consumption. I thought V8 must garbage collect
      // all intermediate Mat while executing chain calls, but it does
      // not do it.

      // Furthermore, it does not clean event normal Mat's created in process
      // of looping through frames
      if (ended) return;

      let rawFrame: Buffer = videoPipe.read(dims.bytes);
      if (!rawFrame) return;
      if (rawFrame.length !== dims.bytes) return;

      iteration++;
      if (iteration % takeEachFrame > 0) return;
      if (iteration % takeEachFrame == 0) iteration = 0

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

      if (ended) return releaseImages();

      // Now filtering face conditions
      if (frontalFaces.length) {
        if (faceSequence.length >= 10) framesWithoutFaces = 0;
      } else {
        framesWithoutFaces++;
        faceSequence = [];
      }

      for (const face of frontalFaces) {
        if (!buffer) buffer = cv.imencode('.png', img);

        const faceImage = img.getRegion(face);
        const faceObject = { face, img: buffer };

        // If exactly 10 faces appeared in the video in sequence,
        // we add them to the array of all faces to make less processing
        // later to check real faces
        if (faceSequence.length === 10) faces.push(...faceSequence, faceObject);

        // And if more than 10 faces appeared in sequence, we can just
        // add them all to the array as sequenced faces are already present
        // in the `faces` array by the previous condition
        if (faceSequence.length > 10) faces.push(faceObject);

        faceSequence.push(faceObject);

        if (detectionSettings.DEBUG_WINDOWS) {
          cv.drawDetection(img, face);
          cv.imshow('face', faceImage);
        }
      }

      if (faceSequence.length >= payload.config.startFaces && !personInLane) {
        parentPort.postMessage({
          event: 'log',
          data: `CHECKING MUTEX :` + checkListMutex.isLocked(),
        });
      }

      await checkListMutex.waitForUnlock();

      // If some number of faces was found without frames with no faces
      // it can mean that person just came to the lane and we've got
      // his faces only
      if (
        faceSequence.length >= payload.config.startFaces &&
        !personInLane &&
        !checkListMutex.isLocked()
      ) {
        // HAAR cascade can really fuck up results, so if we want to start a recording,
        // we want to really make sure that client is in lane, so we check last frame with
        // live model detection.

        const release = await checkListMutex.acquire();

        const [modelDetection, _] = await detectFaces(
          img,
          human,
          faceClassifier,
          { ...detectionConfig, useLiveModel: true },
          tf,
        );

        if (modelDetection.length && !personInLane) {
          // Sending a person lane start event and ensuring we wont
          // send it again by setting a flag
          emit(
            'face_detect.start',
            new FaceDetectDataEvent({
              gotFaces: true,
              numFaces: faceSequence.length,
              camera: payload.camera,
            }),
          );

          parentPort.postMessage({
            event: 'log',
            data: `CLIENT CAME`,
          });

          // Removing all detected faces as they include faces in sequence
          // that was sent to the main thread
          personInLane = true;
        } else {
          faceSequence = [];
          personInLane = false;

          parentPort.postMessage({
            event: 'log',
            data: `CLIENT DID NOT COME`,
          });
        }

        faces = [];
        release();
      }

      // Just for debug purposes draw entire image
      // for classifying
      if (detectionSettings.DEBUG_WINDOWS) {
        cv.imshow('image', img);
        cv.waitKey(10);
      }

      if (detectionSettings.DEBUG_LOGS)
        parentPort.postMessage({
          event: 'log',
          data: `fs: ${faceSequence.length} | fwf ${framesWithoutFaces} | f ${faces.length} | il ${personInLane}`,
        });

      // Client has left the line
      // We need to end a loop and exit a promise returning all faces
      if (
        framesWithoutFaces >= payload.config.maxNoFaces &&
        personInLane &&
        !resolveMutex.isLocked()
      ) {
        resolveMutex.acquire();
        ended = true;
        resolve(faces);
        if (detectionSettings.DEBUG_WINDOWS) cv.destroyWindow('image');
        releaseImages()
        frame.release()
        return clearInterval(interval);
      }

      // Release all reserved memory

      rawFrame = null;
      frame.release();
      releaseImages();
    }, frameInterval);
  });

  // closing rtsp connection
  ffmpegCommand.kill('SIGTERM');

  emit(
    'face_detect.finished',
    new FaceDetectDataEvent({
      gotFaces: faces.length > payload.config.minFaces,
      numFaces: faces.length,
      camera: payload.camera,
    }),
  );

  await saveFaces(faces.map((face) => face.img));
  await wait(300);

  process.nextTick(() => process.exit());
}

function emit(event: string, payload: FaceDetectDataEvent) {
  parentPort.postMessage({
    event,
    data: payload,
  });
}

/**
 * Saves the specified faces to globals.saveTo
 */
async function saveFaces(faces: Buffer[]) {
  if (!globals.saveTo) return;

  return Promise.all(
    faces.map((buffer, index) =>
      fs.writeFile(path.resolve(globals.saveTo, `${index}.png`), buffer),
    ),
  );
}

parentPort.once('message', (data: WorkerStart<LaneFaceDetectParams>) => {
  if (data.action === 'start') {
    worker(data.data);
  }
});

parentPort.on('message', (data: FaceDetectHostEvent) => {
  if (data.event === 'client') {
    globals.saveTo = data.data.saveFacesTo;
  }
});
