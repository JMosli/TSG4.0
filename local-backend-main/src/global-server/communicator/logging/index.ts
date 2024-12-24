import { CommunicatorRequester } from 'communicator/requester';

export class GlobalLoggingApi {
  constructor(private readonly requester: CommunicatorRequester) {}

  /**
   * Adds a poll answer
   */
  addPollAnswer(client_id: number, question: number, answer: number) {
    return this.requester.apiRequest('logging/poll/add_answer', {
      method: 'post',
      data: { question, answer, client_id },
    });
  }

  /**
   * Adds a visit
   */
  addVisit() {
    return this.requester.apiRequest("logging/visit", { method: "post" })
  }
}
