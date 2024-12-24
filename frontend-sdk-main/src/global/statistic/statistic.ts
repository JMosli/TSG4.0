import { Requester } from "../../requester";
import { PaginationRequest } from "../../types";
import {
  PaymentPriceStatistics,
  PaymentStatusStatistics,
  PaymentVisitorStatistics,
  PollStatistics,
  PriceByRangeStatistics,
} from "./types";

export class StatisticApi {
  constructor(private readonly requester: Requester) {}
  /**
   * Gets top 10 payments by price and avg price
   * @return list of payments
   */
  paymentPrice(rangeId?: number, dateRange?: [number, number]) {
    return this.requester.apiRequest<PaymentPriceStatistics>(
      "/statistics/payment/price",
      {
        params: {
          range_id: rangeId,
          start_date: dateRange ? dateRange[0] : undefined,
          end_date: dateRange ? dateRange[1] : undefined,
        },
      }
    );
  }

  /**
   * Gets all payments by statuses
   * @return 2 numbers, amount of completed payments and payments in process (created)
   */
  paymentStatus(rangeId?: number) {
    return this.requester.apiRequest<PaymentStatusStatistics>(
      "/statistics/payment/status",
      { params: { range_id: rangeId } }
    );
  }

  /**
   * Get number of users visited payment page (just visited)
   * @return number of visited users
   */
  visitorCounter(rangeId?: number) {
    return this.requester.apiRequest<PaymentVisitorStatistics>(
      "/statistics/payment/visitors",
      { params: { range_id: rangeId } }
    );
  }

  /**
   * Returns sales by range
   */
  priceByRange(pagination: PaginationRequest) {
    return this.requester.apiRequest<PriceByRangeStatistics>(
      "/statistics/payment/price_by_range",
      { params: pagination }
    );
  }

  /**
   * Returns a statistics for a poll
   */
  poll(rangeId?: number) {
    return this.requester.apiRequest<PollStatistics>("/statistics/poll", {
      params: { range_id: rangeId },
    });
  }
}
