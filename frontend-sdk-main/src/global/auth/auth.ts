import { Requester } from "../../requester";
import { ApiError } from "../../types";
import { AuthRequest, AuthResponse, GetMeResponse, User } from "./types";

export class AuthApi {
  constructor(private readonly requester: Requester) {}

  /**
   * Sings into the system using username and password.
   * Returns access token to access all endpoints
   */
  login(params: AuthRequest) {
    return this.requester.apiRequest<
      AuthResponse,
      ApiError<"not_found", "Not Found", 404>
    >("/auth/login", {
      method: "post",
      data: params,
    });
  }

  /**
   * Retrieves current signed user
   */
  getMe() {
    return this.requester.apiRequest<GetMeResponse>("/users/me");
  }
}
