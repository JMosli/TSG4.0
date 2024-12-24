import { Terminal } from "../payment/terminal/types";

export interface Kiosk {
  id: number;
  is_connected: boolean;
  access_key: string;
  rangeId: number;
  camera?: { id: number } | null;
  terminal?: Terminal;
}

export interface PriceGroup {
  date: string;
  count: number;
}

export interface KioskAnalytics {
  price_by_day: PriceGroup[];
  clients: number;
}
