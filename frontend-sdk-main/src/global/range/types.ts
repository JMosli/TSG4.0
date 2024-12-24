export interface Range {
  id: number;
  name: string;
  ip_address: string;
  public_key_range: string;
  public_key_checker: string;
}

export interface RangeWithUsers extends Range {
  owners: Array<{ id: number; email: string; username: string }>;
  security_guards: Array<{ id: number; email: string; username: string }>;
}

export interface CreateRangeRequest {
  ip_address: string;
  name: string;
  owner_user_id: number;
}

export interface UserConnectRequest {
  connect?: number[];
  disconnect?: number[];
}

export interface UpdateRangeRequest {
  name?: string;

  owners?: UserConnectRequest;
  security_guards?: UserConnectRequest;
}
