import { Requester } from "../requester";
import { Paginated, PaginationRequest } from "../types";
import { Client, ClientWithVideo } from "./types";

export class ClientApi {
  constructor(private readonly requester: Requester) {}
  /**
   * Used by admin to get all clients that were not deleted and were in lanes
   * @param params - pagination
   */
  list(params: PaginationRequest) {
    return this.requester.apiRequest<Paginated<ClientWithVideo>>(
      "/client/all",
      { params }
    );
  }

  /**
   * Retrieves one specified client
   * @param clientId - id of a client
   */
  retrieve(clientId: number) {
    return this.requester.apiRequest<ClientWithVideo>(`/client/${clientId}`);
  }

  /**
   * Removes all data associated with the specified client
   * @param clientId - id of a client
   */
  remove(clientId: number) {
    return this.requester.apiRequest(`/client/${clientId}`, {
      method: "delete",
    });
  }
}
