import { CommunicatorRequester } from 'communicator/requester';
import { SendMessageRequest } from './types';

export class GlobalMailingApi {
  constructor(private readonly requester: CommunicatorRequester) {}

  /**
   * Sends a message to all range owners
   */
  sendOwnersMessage(data: SendMessageRequest) {
    return this.requester.apiRequest('mailing/send_owner', {
      method: 'post',
      data,
    });
  }
}
