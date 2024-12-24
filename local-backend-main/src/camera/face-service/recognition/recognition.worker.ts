import { Client } from '@prisma/client';
import { randomInt } from 'crypto';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import * as WorkerEngine from 'shinobi-worker';
import { savingSettings } from 'src/camera/constants';
import { WorkerStart } from 'src/camera/utils/worker.types';
import { setupSettings } from 'src/setup/constants';
import { readdir } from '../detection-common.utils';
import { FaceRecognizeParams, RecognitionEvent } from './types';

const parentPort = WorkerEngine.buildParentPort({
  json: true,
  debug: true,
});

async function worker(payload: FaceRecognizeParams) {
  // Getting all clients directories sorted by data with paths and stats
  const clientDirectories = await readdir(setupSettings.CLIENTS_PATH, true)
    .then((paths) =>
      paths.map(async (path) => {
        const stat = await fs.stat(path); // getting fs.stat for every directory
        return { ...stat, path };
      }),
    )
    .then((stats) => Promise.all(stats)) // waiting for stat to complete
    .then((stats) => stats.toSorted((a, b) => b.birthtimeMs - a.birthtimeMs)); // sorting by descending date to get most recent

  const numFaces = payload.config.numFaces;

  const isNth = (index: number, paths: string[]) =>
    index % Math.round(paths.length / numFaces) == 0;

  // Getting image buffers from image files
  const images = await readdir(payload.imagesDirectory).then((paths) =>
    paths.filter((_, index) => isNth(index, paths)),
  );

  // Running all detect tasks in promises in parallel, so
  // we dont wait until previous client is found not similar
  await Promise.all(
    clientDirectories.map(async (clientDirectory) => {
      // Getting info about client from client options file
      const clientOptionsPath = path.resolve(
        clientDirectory.path,
        savingSettings.USER_OPTIONS_NAME,
      );
      if (!existsSync(clientOptionsPath)) return;

      const client = await fs
        .readFile(clientOptionsPath)
        .then((buffer) => JSON.parse(buffer.toString()) as Client);

      // Getting matcher file
      const matcherFile = path.resolve(
        clientDirectory.path,
        `face_${client.face_id}`,
        savingSettings.MATCHER_NAME,
      );
      if (!existsSync(matcherFile)) return;

      // process id must be the same for the same
      // recognition sessions
      const processId = randomInt(1001, 9999);

      // Looping through all images and searching for image that is similar with
      // the face we expect
      return Promise.all(
        images.map(async (face) => {
          emit('face_recognizer.start_worker', {
            client,
            processId,
            facePath: face,
            matcherPath: matcherFile,
            config: { similarity: 0, numFaces: images.length },
          });
        }),
      );
    }),
  );
}

async function emit(
  event: RecognitionEvent['event'],
  data: RecognitionEvent['data'],
) {
  parentPort.postMessage({
    event,
    data,
  });
}

parentPort.once('message', (data: WorkerStart<FaceRecognizeParams>) => {
  if (data.action === 'start') {
    worker(data.data);
  }
});
