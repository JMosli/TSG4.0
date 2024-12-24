import { Requester } from "../requester";
import { Paginated, PaginationRequest } from "../types";
import { CameraRecordingApi } from "./recordings/camera-recordings";
import { Camera, CameraConnectRequest, CameraConfig } from "./types";
import { CameraWebrtcApi } from "./webrtc/camera-webrtc";
import { FrameVideoApi } from './frame/frame';

export class CameraApi {
  webrtc: CameraWebrtcApi;
  recording: CameraRecordingApi;
  frame: FrameVideoApi

  constructor(private readonly requester: Requester) {
    this.webrtc = new CameraWebrtcApi(requester);
    this.recording = new CameraRecordingApi(requester);
    this.frame = new FrameVideoApi(requester)
  }

  /**
   * Returns all cameras registered in the database
   * @param params - pagination parameters
   */
  public async list(params: PaginationRequest) {
    return this.requester.apiRequest<Paginated<Camera>>("/camera/all", {
      params,
    });
  }
  /**
   * Retrieves one camera by its id
   * @param cameraId - id of a camera
   */
  public async retrieve(cameraId: number) {
    return await this.requester.apiRequest<Camera>(`/camera/${cameraId}`);
  }

  /**
   * Updates the specified keys in the camera config
   * @param cameraId - id of a camera
   * @param config - update part
   */
  public async updateCameraConfig(cameraId: number, config: CameraConfig) {
    return await this.requester.apiRequest(
      `/camera/${cameraId}/update_config`,
      {
        method: "post",
        data: config,
      }
    );
  }
  /**
   * Probes a network to find cameras
   * Returns detected cameras
   */
  public async runNetworkProbe() {
    return await this.requester.apiRequest("/camera/probe", {
      method: "post",
    });
  }
  /**
   * Creates new camera
   * @param connectProperties - properties of a new camera
   */
  public async connectCamera(connectProperties: CameraConnectRequest) {
    return await this.requester.apiRequest("/camera/connect", {
      method: "post",
      data: connectProperties,
    });
  }
  /**
   * Disconnects a camera from any stream (face detector)
   * @param cameraId - id of a camera
   */
  public async disable(cameraId: number) {
    return await this.requester.apiRequest(`/camera/${cameraId}/disable`, {
      method: "post",
    });
  }
  /**
   * Stops and starts camera stream.
   * Can be used to apply config changes to stream.
   * @param cameraId - id of a camera
   */
  public async restartStream(cameraId: number) {
    return await this.requester.apiRequest(
      `/camera/${cameraId}/restart_stream`,
      {
        method: "post",
      }
    );
  }
  /**
   * Assigns new stream url to the camera
   * @param cameraId - id of a camera
   * @param streamUrl - new stream url of a camera
   */
  public async changeStreamUrl(cameraId: number, streamUrl: string) {
    return await this.requester.apiRequest(
      `/camera/${cameraId}/update_stream_url`,
      {
        method: "post",
        data: {
          stream_url: streamUrl,
        },
      }
    );
  }
  /**
   * Removes a camera from the database
   * @param cameraId - id of a camera
   */
  public async remove(cameraId: number) {
    return await this.requester.apiRequest(`/camera/${cameraId}`, {
      method: "delete",
    });
  }
}
