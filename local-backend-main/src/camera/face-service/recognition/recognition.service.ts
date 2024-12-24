import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import path from 'path';
import * as WorkerEngine from 'shinobi-worker';
import { startWorker } from 'src/camera/utils/worker.tools';
import { ConfigService } from 'src/config/config.service';
import {
  FaceRecognizeEvent,
  FaceRecognizeParams,
  FaceTrainEvent,
  FaceTrainParams,
  RecognitionEvent,
  RecognizeClientParams,
} from './types';

/**
 * The logic behind recognition is simple: get detected faces, pipe them into
 * the recognition module and it will emit a signal when something was found.
 *
 * Basically, implementation includes 3 steps of face recognition:
 *  1. Train - extracts a useful information about faces (face landmarks)
 *  and saves this information into the matcher.json file in the filesystem.
 *  2. Recognize - takes a list of face images, goes through all matcher.json files
 *  and searches for a face that has the maximum similarity with the input face image
 *  3. Client Recognition - this is an internal step that is executed by recognition step.
 *  Receives only one image and one matcher as an input and returns if image matches the specific face
 *
 * All these steps are running in different threads using workers. They are exchanging information
 * using stdin and stdout of every process.
 */

@Injectable()
export class FaceRecognitionService {
  private readonly logger = new Logger(FaceRecognitionService.name);
  public readonly clientRecognitionWorkers: WorkerEngine.Worker[] = [];

  /**
   * The key is process id.
   * The basic idea after this is to wait for all separate
   * recognition processes to finish and for us to get an average
   * value of similarity.
   * So when the recognition.worker.ts starts a recognition for each client,
   * it sets the same process id in all of requests. So all recognition tasks
   * for the user are grouped, but still spread across multiple threads.
   * We know when to stop by using the length of the images to compare. It is
   * combination of numFaces value and algo behind the recognition.worker.ts
   */
  public readonly recognitionProcesses: Map<
    number,
    { events: Array<FaceRecognizeEvent>; numFaces: number }
  > = new Map();

  private nextWorkerIndex = 0;

  private numWorkers: number;

  constructor(
    private eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.initClientRecognition();
  }

  /**
   * Trains a model for face recognition
   */
  train(payload: FaceTrainParams) {
    startWorker<FaceTrainEvent>(
      path.resolve(__dirname, 'train.worker.js'),
      payload,
      (event) => {
        this.eventEmitter.emit(event.event, event.data);
      },
    );
  }

  /**
   * Start a recognition task returning recognition results
   */
  recognize(payload: FaceRecognizeParams) {
    return startWorker<RecognitionEvent>(
      path.resolve(__dirname, 'recognition.worker.js'),
      payload,
      (event) => {
        this.queueClientRecognition(event.data);
      },
    );
  }

  /**
   * Queues new task in one of the workers for face recognition
   * Note: changes the nextWorkerIndex value
   */
  private async queueClientRecognition(payload: RecognizeClientParams) {
    const similarity = await this.configService.get<number>(
      'camera.recognition.similarity_level',
    );
    const numFaces = (
      await this.configService.get<number>(
        'camera.recognition.faces_to_recognize',
      )
    ).value;

    if (!similarity)
      return this.logger.warn(
        'could not queue recognition task: similarity value camera.recognition.similarity_level was not found',
      );

    const worker = this.clientRecognitionWorkers.at(this.nextWorkerIndex);
    const recognizeId = payload.client.id * payload.processId;
    worker.postMessage({
      action: 'recognize',
      data: {
        ...payload,
        processId: recognizeId,
        config: { similarity: similarity.value, numFaces },
      },
    });

    if (!this.recognitionProcesses.has(recognizeId))
      this.recognitionProcesses.set(recognizeId, {
        events: [],
        numFaces: payload.config.numFaces,
      });

    this.nextWorkerIndex = (this.nextWorkerIndex + 1) % this.numWorkers;
  }

  /**
   * Starts all client recognition workers
   */
  private async initClientRecognition() {
    this.numWorkers = (
      await this.configService.get<number>('camera.recognition.workers_num')
    )?.value;

    if (!this.numWorkers)
      return this.logger.warn(
        'could not register recognition workers: value camera.recognition.workers_num was not found',
      );

    for (let i = 0; i < this.numWorkers; ++i) {
      this.clientRecognitionWorkers.push(
        startWorker<FaceRecognizeEvent>(
          path.resolve(__dirname, 'recognize-client.worker.js'),
          {},
          this.onRecognitionResult.bind(this),
        ),
      );
    }

    this.logger.debug(`started ${this.numWorkers} client recognition workers`);
  }

  /**
   * Fires when one recognition worker finishes
   */
  private async onRecognitionResult(event: FaceRecognizeEvent) {
    const similarity = await this.configService.get<number>(
      'camera.recognition.similarity_level',
    );
    const process = this.recognitionProcesses.get(event.data.processId);
    if (!process)
      return this.logger.warn(
        `somewhy not found recognition process ${event.data.processId}`,
      );

    if (this.recognitionProcesses.size > 40)
      this.logger.warn(
        `leak detected. Number of recognition processes is large (${this.recognitionProcesses.size})`,
      );

    console.log(this.recognitionProcesses.size)

    // adding the process for the future process
    process.events.push(event);

    if (process.events.length < process.numFaces) return;

    // all workers must be done, remove process from the pool
    this.recognitionProcesses.delete(event.data.processId);

    // now when we got all the results, we need to calculate an
    // average similarity of results
    // is its not detected, -1 will be added
    const avg =
      process.events.reduce((acc, curr) => {
        if ('not_recognized' in curr.data) return acc - 1;
        if ('similarity' in curr.data)
          return acc + curr.data.similarity.similarity;
      }, 0) / process.events.length;

    if (avg > similarity.value) {
      this.eventEmitter.emit(event.event, {
        ...event.data,
        similarity: {
          similarity: avg,
        },
      });
    }
  }
}
