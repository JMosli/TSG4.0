export interface RetrievePaymentResponse {
  video?: Array<{ uid: string }>;
  photo?: Array<{ uid: string }>;
  checkout_id: string;
  invoice_id: string;
  url: string;
  active: boolean;
  rangeId: number;
}

export interface BuyMediaRequest {
  token: string;
  email: string;
}
