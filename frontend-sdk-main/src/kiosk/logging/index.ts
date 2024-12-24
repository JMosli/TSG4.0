import { Requester } from "../../requester";
import { PollAnswerRequest } from "./types";

export class LoggingApi {
  constructor(private readonly requester: Requester) {}

  /**
   * Logs a poll answer
   */
  addPollAnswer(value: PollAnswerRequest) {
    return this.requester.apiRequest(`/kiosk/logging/add_poll_answer`, {
      method: "post",
      data: value,
    });
  }

  /**
   * Logs a single visit
   */
  visit() {
    return this.requester.apiRequest("/kiosk/logging/add_visit", {
      method: "post",
    });
  }
}
