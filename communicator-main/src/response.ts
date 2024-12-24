import { ApiError } from './types';

/**
 * Class for all unwrap exceptions
 */
export class UnwrapFailure extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnwrapFailure';
  }
}

export class ApiResponse<
  Success extends object,
  Err extends ApiError<any, any, any> = ApiError<string, string, string>,
> {
  constructor(public response: object) {}

  /**
   * Checks if response is error or not.
   * @returns if response was successful or not
   */
  isErr() {
    return (
      'message' in this.response &&
      'error' in this.response &&
      'statusCode' in this.response &&
      'timestamp' in this.response &&
      'type' in this.response &&
      this.response.type === 'error'
    );
  }

  /**
   * Transforms response into Err, mapping Success into null
   * @returns error if response is error, null if it is not
   */
  err(): Err | null {
    return this.isErr() ? (this.response as Err) : null;
  }

  /**
   * Transforms response into Success, mapping Err into null.
   * @returns success if response is not error, null if it is error
   */
  ok(): Success | null {
    return !this.isErr() ? (this.response as Success) : null;
  }

  /**
   * Returns the container Success value and throws if it is an error
   * @throws {UnwrapFailure} if error.
   */
  unwrap(): Success {
    if (this.isErr()) throw new UnwrapFailure(this.err()?.message);

    return this.response as Success;
  }

  /**
   * Returns the contained Err value and throws if it is a Success
   * @throws {UnwrapFailure} if success
   */
  unwrapErr(): Err {
    if (!this.isErr()) throw new UnwrapFailure('');

    return this.response as Err;
  }

  /**
   * Returns both Success and Err
   */
  transpose() {
    return [this.ok(), this.err()] as [Success, null] | [null, Err];
  }
}
