import { GlobalApi } from "frontend-sdk";

console.log("initializing");

export const globalApi = new GlobalApi(import.meta.env.VITE_BACKEND_URL, "");
