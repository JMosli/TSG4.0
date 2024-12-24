import { Requester } from "../../requester";
import { AgentObjectResponse } from "./types";

export class CameraWebrtcApi {
  constructor(private readonly requester: Requester) {}

  /**
   * Returns an agent dvr object
   */
  getObject(cameraId: number) {
    return this.requester.apiRequest<AgentObjectResponse>(
      `/camera/${cameraId}/webrtc/agentdvr/object`
    );
  }
}
