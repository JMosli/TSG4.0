export interface PriceGroup {
  date: string;
  count: number;
}

export interface KioskAnalytics {
  priceByDay: PriceGroup[];
  clients: number;
}
