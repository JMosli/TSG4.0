import { GlobalApi } from "frontend-sdk";

export default function useGlobalApi(token?: string) {
  return new GlobalApi(import.meta.env.VITE_BACKEND_URL, token ?? "");
}
