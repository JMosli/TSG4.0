export interface Terminal {
  id: number;
  is_connected: boolean;
  reader_id: string;
  rangeId: number;
}

export interface CreateTerminalRequest {
  reader_id: string;
  kiosk_id: number;
}
