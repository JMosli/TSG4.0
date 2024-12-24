import { OnGatewayConnection, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export class BaseWebsocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  wsClients: Socket[] = [];
  // Handling broadcast messages
  // server.emit or server.broadcast.emit dont work,
  // so we need to keep track of all clients connected to the
  // websocket server

  handleConnection(client: Socket) {
    this.wsClients.push(client);
  }

  handleDisconnect(client: Socket) {
    for (let i = 0; i < this.wsClients.length; i++) {
      if (this.wsClients[i] === client) {
        this.wsClients.splice(i, 1);
        break;
      }
    }
    client.disconnect();
  }

  protected broadcast(event: string, message: object) {
    for (const client of this.wsClients) {
      client.emit(event, message);
    }
  }
}
