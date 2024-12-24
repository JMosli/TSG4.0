export enum ConfigErrors {
  ProtectedEntry = 'entry_is_system_protected',
}

export type ConfigEntry<Key, Value> = {
  id: number;
  must_reboot: boolean;
  key: Key;
  value: Value;
  is_system: boolean;
};
