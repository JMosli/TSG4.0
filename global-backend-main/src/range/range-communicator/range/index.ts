import { CommunicatorRequester } from 'communicator/requester';
import { UserContext } from 'src/auth/types';
import { ConfigEntry, RangeRange } from './types';

/**
 * Controls /range requests on the range server side
 */
export class RangeRangeApi {
  constructor(private readonly requester: CommunicatorRequester) {}

  /**
   * Removes default range on the local side server
   * @param user user to send to the range
   * @returns removed local range
   * @guards GlobalRequest, User
   * @onlyGLobalAdmin
   * @signed
   */
  removeRange(rangeId: number, user: UserContext) {
    return this.requester.apiRequest<RangeRange>('/range/remove', {
      data: { _internal: { user }, range_id: rangeId },
      method: 'delete',
    });
  }

  /**
   * Gets config key
   */
  getConfigKey<V>(key: string) {
    return this.requester.apiRequest<ConfigEntry<string, V>>(`/config/${key}`, {
      method: 'get',
    });
  }
}
