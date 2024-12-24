import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import path from 'path';
import { startWorker } from 'src/camera/utils/worker.tools';
import { DetectMessage, KioskFaceDetectParams } from './types';

@Injectable()
export class KioskFaceDetectService {
  constructor(private eventEmitter: EventEmitter2) {}

  startDetection(payload: KioskFaceDetectParams) {
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
