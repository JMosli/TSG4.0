import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

export const rebuildError = (resp: string | object) => ({
  ...(resp instanceof Object ? resp : {}),
  type: 'error',
  timestamp: new Date().toDateString(),
});

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    response.status(status).json(rebuildError(exceptionResponse));
  }
}
