import { CommunicatorRequester } from 'communicator/requester';
import { UploadRequest, UploadResponse } from './types';

export class GlobalPhotoApi {
  constructor(private readonly requester: CommunicatorRequester) {}

  /**
   * Uploads sold photo to the server
   * @returns photo file
   */
  upload(photo: Buffer, payload: UploadRequest) {
    return this.requester.apiRequest<UploadResponse>('photo/upload', {
      timeout: 1800 * 1000,
      data: {
        ...payload,
        photo: photo.toString('base64'),
      },
    });
  }

  /**
   * Gets random bought photos
   */
  getBoughtPhotos() {
    return this.requester.apiRequest<Array<{ uid: string }>>(
      'photo/preview_bought',
      { method: 'get' },
    );
  }
}
