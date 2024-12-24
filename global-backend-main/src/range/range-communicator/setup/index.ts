import { CommunicatorRequester } from 'communicator/requester';
import { SetupAcknowledgement } from './types';

export class RangeSetupApi {
  constructor(private readonly requester: CommunicatorRequester) {}

  /**
   * Sends all needed data for range to be created on local server.
   * @param parameters parameters to send to the local server
   * @returns acknowledgement
   */
  async createRange({
    privateKey,
    publicKey,
    rangeId,
  }: {
    privateKey: string;
    publicKey: string;
    rangeId: number;
  }) {
    return this.requester.request<SetupAcknowledgement>(
      '/setup/range',
      {
        data: {
          public_key_checker: publicKey,
          private_key_signer: privateKey,
          range_id: rangeId,
        },
      },
      { 'Initial-Setup': process.env.INITIAL_RANGE_SECRET_KEY },
    );
  }
}
