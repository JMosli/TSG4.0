import {Requester} from "../../requester";
import { Paginated } from "../../types";
import {GetAllRecordingsDto, Recording} from "./types";

export class CameraRecordingApi {
  constructor(private readonly requester: Requester) {}
  /**
   * Returns all recording in the database
   * @param params - pagination parameters
   * @maxTake 20
   */
  public async findAllRecordings(params: GetAllRecordingsDto) {
    return await this.requester.apiRequest<Paginated<Recording>>("/camera/recording/all", { params });
  }
  /**
   * Retrieves a single recording from the database
   * @param recordingId - id of a recording
   */
  public async findRecordingById(recordingId: number) {
    return await this.requester.apiRequest<Recording>(`/camera/recording/${recordingId}`);
  }

  /**
   * Gets recorder status
   */
  public getStatus(cameraId: number) {
    return this.requester.apiRequest<{ is_active: boolean }>(
      `/camera/recording/recorder/status/${cameraId}`
    );
  }

  /**
   * Starts a recording on a certain camera
   */
  public record(cameraId: number) {
    return this.requester.apiRequest(
      `/camera/recording/recorder/start/${cameraId}`,
      { method: "post" }
    );
  }

  /**
   * Stops a recording on a certain camera
   */
  public stopRecording(cameraId: number) {
    return this.requester.apiRequest<{ is_active: boolean }>(
      `/camera/recording/recorder/stop/${cameraId}`,
      { method: "post" }
    );
  }

  /**
   * Removes a recording from the database
   */
  public remove(recordingId: number) {
    return this.requester.apiRequest<Recording>(
      `/camera/recording/${recordingId}`,
      { method: "delete" }
    );
  }
}
