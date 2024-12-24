import { Range } from "../range/types";

export interface Payment {
  id: number;
  checkout_id: string;
  uid: string;
  url: string;
  invoice_id: string;
  active: boolean;
  price: number;
  range_session_uid: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPriceStatistics {
  totals: {
    _avg: {
      price: number;
    };
    _sum: {
      price: number;
    };
  };
  price_by_day: Array<{ date: string; total_price: number }>;
}

export interface PaymentStatusStatistics {
  totals: {
    active: number;
    inactive: number;
  };
  status_by_day: Array<{
    date: string;
    active_count: number;
    inactive_count: number;
  }>;
}

export interface PaymentVisitorStatistics {
  visitors: number;
}

export interface PriceByRangeStatistics {
  count: number;
  items: Array<
    Omit<Range, "public_key_checker" | "public_key_range"> & {
      total_price: number;
    }
  >;
}

export interface AnswerStatistics {
  count: number;
  answer: number;
}

export interface QuestionStatistics {
  question: number;
  answers: AnswerStatistics[];
}

export interface PollStatistics {
  count: number;
  grouped: QuestionStatistics[];
}
