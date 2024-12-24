import { OnEvent } from '@nestjs/event-emitter';
import { OnGatewayConnection, WebSocketGateway } from '@nestjs/websockets';
import { BaseWebsocketGateway } from 'src/helpers/websockets.gateway';
import { WebhookDto } from './dto/webhook.dto';
import { CheckoutCompletedEvent } from './types';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: 'payment',
})
export class PaymentSocketGateway
  extends BaseWebsocketGateway
  implements OnGatewayConnection, OnGatewayConnection
{
  @OnEvent('payment.checkout_completed')
  checkoutCompleted(event: WebhookDto<CheckoutCompletedEvent>) {
    this.broadcast('payment.checkout_completed', event);
  }
}
