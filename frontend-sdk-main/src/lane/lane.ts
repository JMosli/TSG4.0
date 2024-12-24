import {Requester} from "../requester";

export class LaneApi {
    constructor(private readonly requester: Requester) {}
    /**
     * Starts face detection job for lane
     * @param cameraId - which camera starting detecting
     * @param lane - white lane starting detecting
     */
    public async attachCameraToLane(cameraId: number, lane: string) {
        return await this.requester.apiRequest(`/lane/${lane}/attach_camera/${cameraId}`, {
            method: 'post',
        });
    }
    /**
     * Destroys face detection job
     * @param cameraId - which camera stopping detecting
     * @param lane - white lane stopping detecting
     */
    public async detachCameraFromLane(cameraId: number, lane: string) {
        return await this.requester.apiRequest(`/lane/${lane}/detach_camera/${cameraId}`, {
            method: 'post'
        });
    }
}
