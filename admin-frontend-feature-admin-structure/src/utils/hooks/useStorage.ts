import { useEffect, useState } from "react";

export default function useStorage(key: string) {
  const [value, setValue] = useState<string | number | null>("");

  const listener = (event: StorageEvent) => {
    if (event.key === key) setValue(event.newValue);
  };

  useEffect(() => {
    window.addEventListener("storage", listener);

    return () => window.removeEventListener("storage", listener);
  }, []);

  return value;
}
