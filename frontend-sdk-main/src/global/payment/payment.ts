import { CreatePaymentResponse } from "../../payment/types";
import { Requester } from "../../requester";
import { BuyMediaRequest, RetrievePaymentResponse } from "./types";

export default class GlobalPaymentApi {
  constructor(private readonly requester: Requester) {}

  /**
   * Retrieves a single payment
   */
  retrieve(uid: string) {
    return this.requester.apiRequest<RetrievePaymentResponse>(
      `/payment/${uid}`
    );
  }

  /**
   * Buys a single media
   */
  buyMedia(data: BuyMediaRequest) {
    return this.requester.apiRequest<CreatePaymentResponse>(
      "/payment/buy_media",
      { method: "post", data }
    );
  }
}
