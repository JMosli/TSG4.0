import { CommunicatorRequester } from 'communicator/requester';
import { RangeSetupApi } from './setup';
import { PingResponse } from './types';
import { RangeRangeApi } from './range';
import { RangePaymentApi } from './payment';
import { ConfigurationApi } from 'frontend-sdk/dist/configuration/configuration';

export class RangeCommunicator {
  setup: RangeSetupApi;
  range: RangeRangeApi;
  payment: RangePaymentApi;

  constructor(public requester: CommunicatorRequester) {
    this.setup = new RangeSetupApi(requester);
    this.range = new RangeRangeApi(requester);
    this.payment = new RangePaymentApi(requester);
  }

  /**
   * Requests range info from the provided range
   * @returns range info
   */
  async getInfo() {
    return this.requester.apiRequest('/range/get_info', { method: 'get' });
  }

  /**
   * Makes ping request to the range to check availability of the service
   * @param rangeHost range base url without pathname
   * @returns checker response or null if unavailable
   */
  public static async ping(rangeHost: string): Promise<PingResponse | null> {
    const url = new URL(rangeHost);
    url.pathname = '/ping';

    const response = await CommunicatorRequester.basicRequest<PingResponse>(
      url.toString(),
      { method: 'get' },
    );
    const [data, error] = response.transpose();

    if (error) return null;
    if (!data.checker || !data.echo || !data.version) return null;
    if (data.echo !== 'tsg-ping') return null;
    if (data.checker !== process.env.RANGE_PING_CHECKER) return null;

    return data;
  }
}
