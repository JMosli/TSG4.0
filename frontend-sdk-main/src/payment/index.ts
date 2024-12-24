import { Requester } from "../requester";
import { CreatePaymentRequest, CreatePaymentResponse } from "./types";

export class PaymentApi {
  constructor(private readonly requester: Requester) {}

  /**
   * Creates a new payment
   */
  create(params: CreatePaymentRequest) {
    return this.requester.apiRequest<CreatePaymentResponse>(
      "/payment/create_session",
      {
        method: "POST",
        data: params,
      }
    );
  }
}
