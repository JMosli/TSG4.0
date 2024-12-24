import { Requester } from "../requester";
import { Configuration } from "./types";

export class ConfigurationApi {
  constructor(private readonly requester: Requester) {}
  /**
   * Returns full config in json format
   */
  public async getFullConfiguration() {
    return await this.requester.apiRequest<Configuration[]>("/config/get_all");
  }
  /**
   * Gets one key from the config
   * @param key - what key to search
   */
  public async get(key: string) {
    return await this.requester.apiRequest<Configuration>(`/config/${key}`);
  }
  /**
   * Adds or updates a key in the config
   * @param key - key to update or setup
   * @param value - new value
   */
  public async set(key: string, value: string) {
    return await this.requester.apiRequest(`/config/${key}`, {
      method: "patch",
      data: {
        value: value,
      },
    });
  }
  /**
   * Removes an entry from the database
   * @param key - key to delete
   */
  public async remove(key: string) {
    return await this.requester.apiRequest<{ count: 1 }>(`/config/${key}`, {
      method: "delete",
    });
  }
}
