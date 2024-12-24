import { CommunicatorRequester } from 'communicator/requester';
import { GlobalLoggingApi } from './logging';
import { GlobalMailingApi } from './mailing';
import { GlobalPaymentApi } from './payment';
import { GlobalPhotoApi } from './photo';
import { GlobalVideoApi } from './video';

export class GlobalCommunicator {
  video: GlobalVideoApi;
  photo: GlobalPhotoApi;
  payment: GlobalPaymentApi;
  mailing: GlobalMailingApi;
  logging: GlobalLoggingApi;

  constructor(public requester: CommunicatorRequester) {
    this.video = new GlobalVideoApi(requester);
    this.photo = new GlobalPhotoApi(requester);
    this.payment = new GlobalPaymentApi(requester);
    this.mailing = new GlobalMailingApi(requester);
    this.logging = new GlobalLoggingApi(requester);
  }
}
