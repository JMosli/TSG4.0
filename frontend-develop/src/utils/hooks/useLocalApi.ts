import { useAppSelector } from "@store/hooks";
import { Api } from "frontend-sdk";
import { useMemo } from "react";

export default function useLocalApi() {
  const token = useAppSelector((state) => state.auth.token);
  const api = useMemo(
    () => new Api(import.meta.env.VITE_BACKEND_URL, token),
    [token]
  );

  return api;
}
