import _tf from '@tensorflow/tfjs-node';
import Human from '@vladmandic/human';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import * as WorkerEngine from 'shinobi-worker';
import {
  getFaceRecognitionOptions,
  getTensor,
  prepare,
} from '../human-utils.tools';
import {
  FaceRecognizeEvent,
  FaceRecognizeResult,
  Matcher,
  RecognizeClientMessage,
  RecognizeClientParams,
} from './types';

let human: Human = null,
  tf: typeof _tf = null;

const parentPort = WorkerEngine.buildParentPort({
  json: true,
  debug: true,
});

async function init() {
  // Initializing values only once
  if (!human || !tf) {
    const { human: _human, tf: _htf } = await prepare();
    human = _human;
    tf = _htf;
  }
}

async function worker(payload: RecognizeClientParams) {
  if (!existsSync(payload.matcherPath) || !existsSync(payload.facePath)) return;

  const isNth = (index: number, samples: any[]) =>
    index % Math.round(samples.length / payload.config.numFaces) == 0;

  const matcher = await fs
    .readFile(payload.matcherPath)
    .then((buffer) => JSON.parse(buffer.toString()) as Matcher);

  const face = await fs.readFile(payload.facePath);

  const tensor = await getTensor(face, tf as typeof _tf);
  const detection = await human.detect(
    tensor.getTensor(),
    getFaceRecognitionOptions(),
  );

  if (!detection?.face?.at?.(0))
    return emit('face_recognizer.recognize.not_detected', {
      not_detected: true,
      processId: payload.processId,
    });

  console.error('trying to recognize');

  const matchSamples = matcher.filter((_, i) => isNth(i, matcher));
  console.error(matchSamples.length);

  const similarity = human.match.find(
    detection.face[0].embedding,
    matchSamples,
  );

  tensor.dispose();

  // If level of similarity is big enough, we end a function and emit a signal
  // that needed client was found
  if (similarity.similarity >= payload.config.similarity - 0.1) {
    emit('face_recognizer.recognize.finished', {
      similarity,
      client: payload.client,
      processId: payload.processId,
      facesDirectory: path.dirname(payload.facePath),
    } as FaceRecognizeResult);
    return;
  } else {
    emit('face_recognizer.recognize.not_detected', {
      not_detected: true,
      processId: payload.processId,
    });
  }
}

async function emit(
  event: FaceRecognizeEvent['event'],
  data: FaceRecognizeEvent['data'],
) {
  parentPort.postMessage({
    event,
    data,
  });
}

parentPort.on('message', (data: RecognizeClientMessage) => {
  if (data.action === 'start') {
    init();
  } else if (data.action === 'recognize') {
    worker(data.data).catch((e) => {
      console.error(e)
      // we must return even if something happens
      emit('face_recognizer.recognize.not_detected', {
        not_detected: true,
        processId: data.data.processId,
        errored: true,
      });
    });
  }
});
