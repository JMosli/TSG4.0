export interface CreateSessionRequest {
  price: number;
  session_uid: string;
  email: string;
  reader_id?: string;
}

export interface CreateSessionResponse {
  id: number;
  uid: string;
  checkout_id: string;
  url: string;
  invoice_id: string;
  active: boolean;
  price: number;
  range_session_uid: string;
  rangeId: number;
}
