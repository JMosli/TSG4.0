export interface Client {
  id: number;
  name: string | null;
  directory: string;
  face_id: number;
  is_on_lane: boolean;
  createdAt: Date;
  cameraId: number | null;
}

export interface ClientWithVideo extends Client {
  videos: Array<{
    id: number;
    is_full: boolean;
    duration: number;
    metadata: { shots: string[] | Array<{ frame: string; token: string }> };
    token?: string;
  }>;
  images: Array<{
    client: number,
    image: {
      frame: string,
      shot: number
    },
    type: string
  }> | [];
}
