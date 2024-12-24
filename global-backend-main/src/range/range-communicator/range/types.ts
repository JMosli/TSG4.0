/**
 * Database entry of Range on the local server
 */
export interface RangeRange {
  id: number;
  private_key_signer: string;
  public_key_checker: string;
  camera_subnet: string;
  is_default: boolean;
  global_id: number;
}

export type ConfigEntry<Key, Value> = {
  id: number;
  must_reboot: boolean;
  key: Key;
  value: Value;
  is_system: boolean;
};
