import axios, {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  RawAxiosRequestHeaders,
} from "axios";
import { sign, verify } from "crypto";
import { ApiError } from "./types";
import { ApiResponse } from "./response";

export class CommunicatorRequester {
  private baseURL: string;
  private httpClient: AxiosInstance;
  /** Private key for signing the requests */
  private signerKey: string;
  /** Public key for checking responses and requests */
  private checkerKey: string;

  private rangeId: string;

  constructor(options: {
    signerKey: string;
    checkerKey: string;
    baseURL: string;
    rangeId: string;
  }) {
    this.httpClient = axios.create({
      baseURL: options.baseURL,
    });
    this.baseURL = options.baseURL;
    this.signerKey = options.signerKey;
    this.checkerKey = options.checkerKey;
    this.rangeId = options.rangeId;
  }

  /**
   * Provides a way to make request without providing any signature.
   * @param url complete url of the range (with ip and path)
   */
  public static async basicRequest<
    Success extends object,
    Err extends ApiError<any, any, any> = ApiError<string, string, number>
  >(url: string, options: AxiosRequestConfig<object> = {}) {
    const response = await axios
      .request<Success>({
        url,
        headers: {
          "Content-Type": "application/json",
        },
        method: "post",
        ...options,
      })
      .catch((e: AxiosError<Err>) => e.response);

    return new ApiResponse<Success, Err>(response.data);
  }

  /**
   * Makes request to the range api signing a payload
   * with signature provided by private signerKey
   *
   * Writes signature in the Signature header in format like:
   * base64(sign(range_id + path + payload))
   * if payload is empty, it just sends {}
   *
   * @param url api path
   * @returns
   */
  public request<
    Success extends object,
    Err extends ApiError<any, any, any> = ApiError<string, string, number>
  >(
    url: string,
    options: AxiosRequestConfig<object> = {},
    headers: RawAxiosRequestHeaders = {}
  ) {
    const parsedUrl = this.parseApiUrl(this.baseURL, url);
    const signaturePayload = CommunicatorRequester.getSignaturePayload(
      this.rangeId,
      parsedUrl.pathname,
      options.data ?? {}
    );
    const signature = sign(
      null,
      Buffer.from(signaturePayload),
      this.signerKey
    ).toString("base64");

    const requestHeaders = {
      Signature: signature,
      "Range-Id": this.rangeId,
      "Content-Type": "application/json",
      ...headers,
    };

    return this.httpClient
      .request<Success>({
        url,
        headers: requestHeaders,
        method: "post",
        ...options,
      })
      .catch((e: AxiosError<Err>) => e.response);
  }

  /**
   * Makes request to the range using RangeRequester.request method,
   * but implements signature checking procedure.
   *
   * It requires from range a signature input in form of:
   * base64(sign(range_id + path + payload))
   *
   * If signature is wrong, it return null. Otherwise, range response.
   * @param url api path
   * @returns
   */
  public async apiRequest<
    Success extends object,
    Err extends ApiError<any, any, any> = ApiError<string, string, number>
  >(
    url: string,
    options: AxiosRequestConfig<object> = {},
    headers: RawAxiosRequestHeaders = {}
  ): Promise<ApiResponse<Success, Err> | null> {
    const parsedUrl = this.parseApiUrl(this.baseURL, url);
    const response = await this.request<Success>(url, options, headers);
    const signature = response.headers.signature;
    const signaturePayload = CommunicatorRequester.getSignaturePayload(
      this.rangeId,
      parsedUrl.pathname,
      response.data ?? {}
    );
    const isSignatureValid = verify(
      null,
      Buffer.from(signaturePayload),
      Buffer.from(this.checkerKey),
      Buffer.from(signature, "base64")
    );

    if (!signature) return null;
    if (!isSignatureValid) return null;
    if (!response.headers["range-id"]) return null;

    return new ApiResponse(response.data);
  }

  /**
   * Builds signature payload string
   */
  public static getSignaturePayload(
    rangeId: string,
    path: string,
    data: object | Buffer
  ) {
    // Form data and Buffer are not serializable, so we dont
    // want them to crash a request.

    const isFormData = "_boundary" in data;
    const dataString = JSON.stringify(
      data instanceof Buffer || isFormData ? {} : data
    );

    return rangeId + path + dataString;
  }

  /**
   * Build full api url out of 2 parts
   */
  public parseApiUrl(baseURL: string, path: string) {
    return new URL(path, baseURL);
  }
}
