export interface PingResponse {
  version: string;
  /** constant string to check validity of the service */
  checker: string;
  echo: 'tsg-ping';
}
