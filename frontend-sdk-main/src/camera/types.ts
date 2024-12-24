export interface Camera {
  id: number;
  ip_address: string;
  port: number;
  username: string;
  password: string;
  stream_url: string;
  streaming: boolean;
  connected: boolean;
  lane_name?: string;
  is_at_kiosk: boolean;
  config: CameraConfig;
  disconnectedAt: string;
  kioskId: number;
}

export interface CameraConfig {
  crop?: [number, number, number, number];
  fps?: number;
  scale?: number;
  targetWidth?: number;
  skipNFrames?: number;
  rotation?: number;
}

export interface CameraConnectRequest {
  ip_address: string;
  port: number;
  username?: string;
  password?: string;
  kioskId?: number;
}
