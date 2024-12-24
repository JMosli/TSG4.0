export interface UserContext {
  id: number;
  username: string;
  email: string;
  is_global_admin: boolean;
  is_owner: boolean;
  is_sg: boolean;
}
