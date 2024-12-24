import { EventDto, WebhookDto } from './dto/webhook.dto';

export type WebhookEvent = WebhookDto<CheckoutCompletedEvent>;

export type CheckoutCompletedEvent = EventDto<
  'checkout.session.completed',
  { session_uid: string; global_session_uid: string }
>;
