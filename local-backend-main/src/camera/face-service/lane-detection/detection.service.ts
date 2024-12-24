import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import path from 'path';
import { startWorker } from '../../utils/worker.tools';
import { DetectMessage, LaneFaceDetectParams } from './types';

@Injectable()
export class LaneFaceDetectService {
  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Starts face processing task. It gets a stream from the specified camera,
   * creates opencv context and starts checking incoming frames for faces in it.
   */
  startDetection(payload: LaneFaceDetectParams) {
    return startWorker(
      path.resolve(__dirname, 'detection.worker.js'),
      payload,
      this.onMessage.bind(this),
    );
  }

  /**
   * Fires when worker sends some message
   */
  private onMessage(payload: DetectMessage) {
    if (payload.event === 'log') {
      return console.log(payload.data);
    }

    this.eventEmitter.emit(payload.event, payload.data);
  }
}
