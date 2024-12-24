import axios, { AxiosRequestConfig } from "axios";
import { v4 as uuid } from "uuid";
import { Api, GlobalApi } from "frontend-sdk";

const axiosConfig: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_DEBUG_KEY}`,
    "ngrok-skip-browser-warning": uuid(),
  },
};

const kioskApi = axios.create(axiosConfig);

export default kioskApi;
