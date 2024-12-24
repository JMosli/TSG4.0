import { useAppSelector } from "@store/hooks";
import { Api } from "frontend-sdk";
import { useMemo } from "react";

export default function useLocalApi(rangeId: string) {
  const { token }: { token: string } = useAppSelector((state) => state.api);

  const url = new URL(
    `v1/range/${rangeId}/api`,
    import.meta.env.VITE_BACKEND_URL
  ).toString();
  const api = useMemo(() => new Api(url, token), [rangeId]);

  return api;
}
