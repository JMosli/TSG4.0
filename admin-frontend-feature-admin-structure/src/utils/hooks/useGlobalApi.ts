import { useAppSelector } from "@store/hooks";
import { GlobalApi } from "frontend-sdk";

export default function useGlobalApi() {
  const { token }: { token: string } = useAppSelector((state) => state.api);

  return new GlobalApi(import.meta.env.VITE_BACKEND_URL, token);
}
