export type ApiError<Message extends string, Err, StatusCode> = {
  /** error message, fixed string (enum or server exception) */
  message: Message | string | string[];
  /** http error name */
  error: Err | string;
  /** http status code */
  statusCode: StatusCode | number;
  /** server timestamp in ISO format */
  timestamp: string;
  type: "error";
};
