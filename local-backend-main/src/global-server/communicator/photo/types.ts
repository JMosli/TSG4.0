export interface UploadRequest {
  payment_uid: string;
}

export interface UploadResponse {
  id: number;
  uid: string;
  createdAt: Date;
  rangeId: number;
  fileId: number;
  paymentId: number;
}
