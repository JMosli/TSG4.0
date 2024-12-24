import { Requester } from "../requester";
import { Paginated, PaginationRequest } from "../types";
import { Camera } from "../camera/types";
import { Kiosk, KioskAnalytics } from "./types";
import { LoggingApi } from "./logging";

export class KioskApi {
  logging: LoggingApi;

  constructor(private readonly requester: Requester) {
    this.logging = new LoggingApi(requester);
  }

  /**
   * Returns a list of kiosks
   * @param params - pagination parameters
   */
  list(params: PaginationRequest) {
    return this.requester.apiRequest<Paginated<Kiosk>>("/kiosk/all", {
      params,
    });
  }

  /**
   * Finds one kiosk in the database by its id
   * @param kioskId - id of a kiosk
   */
  retrieve(kioskId: number) {
    return this.requester.apiRequest<Kiosk & { camera: Camera }>(
      `/kiosk/${kioskId}`
    );
  }

  /**
   * Used by RO to create kiosk in the system and then
   * use this kiosk to attach camera to it
   */
  create() {
    return this.requester.apiRequest<Kiosk>("/kiosk/create_kiosk", {
      method: "post",
    });
  }

  /**
   * Used by RO to attach camera to the kiosk and start detection stream
   * @param kioskId - id of a kiosk
   * @param cameraId - id of a camera
   */
  attachCamera(kioskId: number, cameraId: number) {
    return this.requester.apiRequest<Kiosk>(
      `/kiosk/${kioskId}/attach_camera/${cameraId}`,
      { method: "post" }
    );
  }

  /**
   * Used by RO to disconnect a camera from kiosk and stop face detection job
   * @param kioskId - id of a kiosk
   * @param cameraId - id of a camera
   */
  detachCamera(kioskId: number, cameraId: number) {
    return this.requester.apiRequest<Kiosk>(
      `/kiosk/${kioskId}/detach_camera/${cameraId}`,
      { method: "post" }
    );
  }

  /**
   * Removes a kiosk from the database
   */
  remove(kioskId: number) {
    return this.requester.apiRequest<Kiosk>(`/kiosk/${kioskId}`, {
      method: "delete",
    });
  }

  /**
   * Returns an analytics parameters for the specified kiosk
   */
  analytics(kioskId: number) {
    return this.requester.apiRequest<KioskAnalytics>(
      `/kiosk/${kioskId}/analytics`
    );
  }
}
