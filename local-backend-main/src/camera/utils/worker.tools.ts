import { detectionSettings } from '../face-service/constants';
import * as WorkerEngine from './shinobi-worker';
import { WorkerEvent } from './worker.types';

/**
 * Creates a worker and sends start action to it.
 * @param payload payload to send to the worker when starting it
 * @param onMessage fires when worker sends some message
 * @returns created worker
 */
export function startWorker<Event extends WorkerEvent>(
  file: string,
  payload: any,
  onMessage: (payload: Event) => any,
  dontStart: boolean = false,
) {
  const worker = WorkerEngine.Worker(file, {
    json: true,
    debug: true,
    spawnOptions: {
      detached: false,
      env: {
        ...process.env,
        TF_CPP_MIN_LOG_LEVEL: '1',
        OPENCV_LOG_LEVEL: 'OFF',
      },
    },
  });

  worker.kill = () => {
    // If we dont close process stream descriptors,
    // it wont exit

    worker.spawnProcess.stdin.end();
    worker.spawnProcess.stdout.end();
    worker.spawnProcess.stderr.end();
    worker.spawnProcess.kill();
  };

  if (!dontStart) {
    // Starting the worker
    worker.postMessage({
      action: 'start',
      data: payload,
    });
  }
  worker.on('error', (err) =>
    console.error(`${worker.spawnProcess.pid} stderr `, err),
  );
  worker.on('message', onMessage);

  process.on('exit', () => worker.kill());

  if (detectionSettings.DEBUG_LOGS)
    console.error(`started ${worker.spawnProcess.pid}: ${file}`);

  return worker;
}

/**
 * Starts and waits worker for a single event whose data is the return data.
 * @returns promise that results in a worker result
 */
export function waitWorker<ReturnType extends WorkerEvent>(
  file: string,
  payload: any,
): Promise<ReturnType> {
  return new Promise((resolve) => {
    startWorker<ReturnType>(file, payload, resolve);
  });
}
