import { CommunicatorRequester } from 'communicator/requester';
import { CreateSessionRequest, CreateSessionResponse } from './types';

export class GlobalPaymentApi {
  constructor(private readonly requester: CommunicatorRequester) {}

  /**
   * Creates a new payment session
   * @returns payment session information including a link
   * and another important information
   */
  createSession(payload: CreateSessionRequest) {
    return this.requester.apiRequest<CreateSessionResponse>(
      'payment/create_payment',
      { method: 'post', data: payload },
    );
  }
}
