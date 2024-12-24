import { Requester } from '../requester';

export class TvApi {
  constructor(private readonly requester: Requester) {}

  public async videoToken(clientId: number, videoId: number) {
    return await this.requester.apiRequest(`/client/${clientId}/media_token?video_id=${videoId}`);
  }

  public async frameToken(clientId: number, frame: number) {
    return await this.requester.apiRequest(`/client/${clientId}/media_token?frame=${frame}`);
  }

  public async boughtMedia() {
    return await this.requester.apiRequest(`/kiosk/tv/bought_media`)
  }
}
