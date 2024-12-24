import { PaginationRequest } from "../../types";

export interface GetAllRecordingsDto extends PaginationRequest {
  manually_recorded?: boolean;
  is_sold?: boolean;
  camera_id?: number;
}

export interface Recording {
  id: number;
  path: string;
  is_sold: boolean;
  manually_recorded: boolean;
  sold_at: Date | null;
  createdAt: Date;
  rangeId: number;
  clientId: number | null;
  cameraId: number | null;
}
