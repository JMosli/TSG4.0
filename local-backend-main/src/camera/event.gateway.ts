import { OnEvent } from '@nestjs/event-emitter';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { Client, Video } from '@prisma/client';
import { BaseWebsocketGateway } from 'src/helpers/websockets.gateway';
import { FaceRecognizeResult } from './face-service/recognition/types';
import { CameraContext } from './types';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'camera',
})
export class CameraSocketGateway
  extends BaseWebsocketGateway
  implements OnGatewayConnection, OnGatewayConnection
{
  @OnEvent('camera.client.processing_finished')
  private async onProcessingFinished(event: Client) {
    this.broadcast('camera.client.processing_finished', event);
  }

  @OnEvent('camera.recording.added')
  private async onAddedRecording(event: Video) {
    this.broadcast('camera.recording.added', event);
  }

  @OnEvent('face_recognizer.recognize.finished')
  private async onFaceRecognized(payload: FaceRecognizeResult) {
    this.broadcast('face_recognizer.recognize.finished', payload);
  }

  @OnEvent('camera.setup.added')
  private async cameraAdded(event: CameraContext[]) {
    this.broadcast('camera.setup.added', event);
  }

  @OnEvent('camera.setup.removed')
  private async cameraRemoved(event: CameraContext[]) {
    this.broadcast('camera.setup.removed', event);
  }
}
