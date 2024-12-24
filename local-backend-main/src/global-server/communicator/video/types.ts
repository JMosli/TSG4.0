export interface UploadResponse {
  id: number;
  uid: string;
  createdAt: Date;
  rangeId: number;
  fileId: number;
  paymentId: number;
}

export interface UploadRequest {
  payment_uid: string;
  local_id: number;
}
