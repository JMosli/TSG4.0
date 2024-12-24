export type RangeEventType = 'checkout.session.completed';

export type RangeWebhookEvent<Ev> = {
  type: RangeEventType;
  data: Ev;
};

export interface WebhookResponse {
  success: boolean;
}

export interface CreatePaymentResponse {
  session: {
    id: number;
    video_ids: number[];
    uid: string;
    active: boolean;
    kioskId: number;
    createdAt: Date;
  };
  link: CreateSessionResponse;
}

export interface CreateSessionResponse {
  id: number;
  checkout_id: string;
  url: string;
  invoice_id: string;
  active: boolean;
  price: number;
  range_session_uid: string;
  rangeId: number;
  uid: string;
}

export interface PhotoDefinition {
  timestamp: number;
  client_id: number;
}

export interface CreatePaymentRequest {
  client_ids: number[];
  email: string;
  video_ids?: number[];
  photos?: PhotoDefinition[];
}
