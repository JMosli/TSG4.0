import { User } from "../auth/types";

export interface CreateUserRequest extends Omit<User, "id"> {
  password: string;
}

export interface RetrieveUserResponse extends User {
  security_guard_of: Array<{ id: number; name: string }>;
  owner_of: Array<{ id: number; name: string }>;
  created_users: Array<{ id: number; username: string; email: string }>;
}
