import { CommunicatorRequester } from 'communicator/requester';
import { UploadRequest, UploadResponse } from './types';

export class GlobalVideoApi {
  constructor(private readonly requester: CommunicatorRequester) {}

  /**
   * Uploads sold video to the server
   * @param video video contents to upload to the server
   * @returns video file
   */
  upload(video: Buffer, payload: UploadRequest) {
    const formData = new FormData();
    const blob = new Blob([video], { type: 'multipart/form-data' });
    formData.append('video', blob, 'file.mkv');

    return this.requester.apiRequest<UploadResponse>(
      'video/upload',
      {
        data: formData,
        params: payload,
        maxRedirects: 0,
        timeout: 1800 * 1000,
      },
      { 'Content-Type': 'multipart/form-data' },
    );
  }

  /**
   * Gets random bought videos
   */
  getBoughtVideos() {
    return this.requester.apiRequest<Array<{ uid: string }>>(
      'video/preview_bought',
      { method: 'get' },
    );
  }
}
