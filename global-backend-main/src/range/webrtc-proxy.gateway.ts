import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RangeService } from './range.service';
import { Server, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { WsAdapter } from '@nestjs/platform-ws';

@WebSocketGateway({
  cors: { origin: '*' },
  path: '/range/ws',
  transports: ['websocket'],
})
export class WebrtcProxyGateway implements OnGatewayConnection {
  constructor(private readonly rangeService: RangeService) {}

  async handleConnection(client: WebSocket, message: IncomingMessage) {
    const params = new URLSearchParams(message.url.split('?')[1]);
    const rangeId = params.get('range');
    const path = params.get('path');
    const isVideoProxy = params.get('isVideoProxy');
    console.log(params);
    if (!rangeId) return client.close();
    if (isNaN(+rangeId)) return client.close();
    if (!path) return client.close();

    const range = await this.rangeService.findOne({ where: { id: +rangeId } });
    if (!range) return client.close();

    const rangeUrl = new URL(range.ip_address);
    const wsUrl = new URL(
      path,
      `ws://${rangeUrl.hostname}:${isVideoProxy === 'true' ? '1984' : '2356'}`,
    );
    console.log(wsUrl.toString());
    const conn = new WebSocket(wsUrl);
    conn.binaryType = 'arraybuffer';

    conn.on('open', () => {
      client.on('message', (data) => {
        const sendData = data instanceof Buffer ? data.toString() : data;
        conn.send(sendData);
      });
      conn.on('message', (data) => {
        const sendData = data instanceof Buffer ? data.toString() : data;
        client.send(sendData);
      });
    });

    client.on('close', () => conn.close());
    conn.on('close', () => client.close());

    conn.on('error', () => null);
    client.on('error', () => null);
  }
}
