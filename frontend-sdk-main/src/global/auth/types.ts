export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_global_admin: boolean;
  created_by_userId: number | null;
}

export interface GetMeResponse extends User {
  security_guard_of: Array<{ id: number }>;
  owner_of: Array<{ id: number }>;
}
