import { Requester } from "../../requester";

export class FrameVideoApi {
  constructor(private readonly requester: Requester) {}

  async getVideoFrame(
    recordingId: number,
    duration: number | string
  ): Promise<string> {
    const res = await this.requester.request<Blob>(
      `/camera/recording/${recordingId}/frame?frame=${duration}`,
      { responseType: "blob" }
    );
    //@ts-expect-error
    return URL.createObjectURL(res.data);
  }
}
