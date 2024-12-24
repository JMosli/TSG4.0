import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { ApiError } from "./types";
import { ApiResponse } from "./response";
import { objectToCamel, ObjectToCamel } from "ts-case-convert/lib/caseConvert";

export class Requester {
  private httpClient: AxiosInstance;

  constructor(baseURL: string, public token: string) {
    this.httpClient = axios.create({
      baseURL,
    });
  }

  public request<
    R,
    Err extends ApiError<any, any, any> = ApiError<string, string, number>
  >(url: string, options: AxiosRequestConfig<object> = {}) {
    return this.httpClient
      .request<R>({
        url,
        ...options,
        headers: {
          Authorization: `Bearer ${this.token}`,
          ...options.headers,
        },
      })
      .catch((error: AxiosError) => error.response as AxiosResponse<Err>);
  }

  public async apiRequest<
    Success extends object,
    Err extends ApiError<any, any, any> = ApiError<string, string, number>
  >(
    url: string,
    options: AxiosRequestConfig<object> = {}
  ): Promise<ApiResponse<ObjectToCamel<Success>, Err>> {
    const { data } = await this.request<Success, Err>(url, options);

    return new ApiResponse(objectToCamel(data));
  }
}
