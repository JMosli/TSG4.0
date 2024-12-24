import { Requester } from "../../requester";
import { Paginated, PaginationRequest } from "../../types";
import { GetMeResponse, User } from "../auth/types";
import { CreateUserRequest, RetrieveUserResponse } from "./types";

export class UsersApi {
  constructor(private readonly requester: Requester) {}

  /**
   * Returns all users in the database
   */
  list(pagination: PaginationRequest) {
    return this.requester.apiRequest<Paginated<User>>("/users/admin/users", {
      params: pagination,
    });
  }

  /**
   * Retrieves one user
   */
  retrieve(id: number) {
    return this.requester.apiRequest<RetrieveUserResponse>(
      `/users/admin/${id}`
    );
  }

  /**
   * Creates and sets up a new user
   */
  create(user: CreateUserRequest) {
    return this.requester.apiRequest<User>("/users/admin/create_user", {
      method: "post",
      data: user,
    });
  }

  /**
   * Removes a user
   */
  remove(id: number) {
    return this.requester.apiRequest<User>(`/users/admin/${id}`, {
      method: "delete",
    });
  }
}
