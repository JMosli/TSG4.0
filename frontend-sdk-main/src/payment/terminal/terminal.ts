import { Requester } from "../../requester";
import { Paginated, PaginationRequest } from "../../types";
import { CreateTerminalRequest, Terminal } from "./types";

export class TerminalApi {
  constructor(private readonly requester: Requester) {}

  /**
   * Gets all payment terminals in the database
   * @param params pagination parameters
   */
  list(params: PaginationRequest) {
    return this.requester.apiRequest<Paginated<Terminal>>(
      "/payment/terminal/all",
      { params }
    );
  }

  /**
   * Gets one terminal from the database by id
   * @param terminalId id of terminal
   */
  retrieve(terminalId: number) {
    return this.requester.apiRequest<Terminal>(
      `/payment/terminal/${terminalId}`
    );
  }

  /**
   * Creates a payment terminal in the database
   * @return newly created terminal
   */
  create(data: CreateTerminalRequest) {
    return this.requester.apiRequest<Terminal>(
      "/payment/terminal/create_payment_terminal",
      { method: "post", data }
    );
  }

  /**
   * Removes a terminal
   */
  remove(id: number) {
    return this.requester.apiRequest<Terminal>(`/payment/terminal/${id}`, {
      method: "delete",
    });
  }
}
