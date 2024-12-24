import { Client } from "frontend-sdk/dist/client/types";

export interface FaceRecognizeResult {
  similarity: {
    index: number;
    distance: number;
    similarity: number;
  };
  client: { id: number };
  processId: number;
  facesDirectory: string;
}
