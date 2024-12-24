import { Requester } from "../../requester";
import { Paginated, PaginationRequest } from "../../types";
import {
  CreateRangeRequest,
  Range,
  RangeWithUsers,
  UpdateRangeRequest,
} from "./types";

export class RangeApi {
  constructor(private readonly requester: Requester) {}

  /**
   * Lists all ranges in the database
   */
  list(pagination: PaginationRequest) {
    return this.requester.apiRequest<Paginated<Range>>("/range/admin/all", {
      params: pagination,
    });
  }

  /**
   * Returns information about one specific range
   */
  retrieve(id: number) {
    return this.requester.apiRequest<RangeWithUsers>(`/range/admin/${id}`);
  }

  /**
   * Creates a new range with the specified parameters.
   * Note: it requires an ip_address. It must be set to a value like
   * http://127.0.0.1:2356 in order for global server to ping local server.
   * It can also be an ipv6 address in the default form.
   */
  create(params: CreateRangeRequest) {
    return this.requester.apiRequest<Range>(`/range/admin/create_range`, {
      method: "post",
      data: params,
    });
  }

  /**
   * Updates a range parameters. Can be used to connect or disconnect users
   */
  update(id: number, params: UpdateRangeRequest) {
    return this.requester.apiRequest<Range>(`/range/admin/${id}`, {
      method: "patch",
      data: params,
    });
  }

  /**
   * Removes a range
   */
  remove(id: number) {
    return this.requester.apiRequest(`/range/admin/${id}`, {
      method: "delete",
    });
  }
}
