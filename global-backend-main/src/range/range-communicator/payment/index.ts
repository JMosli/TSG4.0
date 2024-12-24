import { CommunicatorRequester } from 'communicator/requester';
import {
  CreatePaymentRequest,
  CreatePaymentResponse,
  RangeWebhookEvent,
  WebhookResponse,
} from './types';

export class RangePaymentApi {
  constructor(private readonly requester: CommunicatorRequester) {}

  /**
   * Makes a request to the range's webhook handler.
   */
  sendWebhookEvent<Ev>(event: RangeWebhookEvent<Ev>) {
    return this.requester.apiRequest<WebhookResponse>('/payment/webhook', {
      data: { event, _internal: { check: true } },
      method: 'post',
      timeout: 1900 * 1000,
    });
  }

  /**
   * Creates a new payment
   */
  create(params: CreatePaymentRequest) {
    return this.requester.apiRequest<CreatePaymentResponse>(
      '/payment/create_session',
      {
        method: 'POST',
        data: params,
      },
    );
  }
}
