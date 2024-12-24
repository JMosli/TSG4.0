import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { PrismaService } from 'src/helpers/prisma.service';
import { RangeContext } from '../constants';
import { CryptoService } from 'src/crypto/crypto.service';
import { CommunicatorRequester } from 'communicator/requester';
import { rebuildError } from 'src/helpers/error.filter';

/**
 * This class intercepts response object and adds Signature and Range-Id headers to it.
 * Requires RangeGuard to be applied on the endpoint as it uses requestedRange from the Request object.
 */
@Injectable()
export class SignerInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly cryptoService: CryptoService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const sign = (data) => {
      const response: Response = context.switchToHttp().getResponse();
      const request: Request & { requestedRange: RangeContext } = context
        .switchToHttp()
        .getRequest();
      // As we already have range data (because of RangeGuard), we can
      // just use data of the requested range to sign our response
      const range = request.requestedRange;
      const signaturePayload = CommunicatorRequester.getSignaturePayload(
        range.id.toString(),
        request.path,
        data ?? {},
      );
      console.log(signaturePayload);
      const signature = this.cryptoService.createSignature(
        signaturePayload,
        range.private_key_signer,
      );

      response.setHeader('Signature', signature.toString('base64'));
      response.setHeader('Range-Id', range.id.toString());
    };

    return next.handle().pipe(
      catchError((err) => {
        sign(rebuildError(err.response));
        return throwError(() => err);
      }),
      tap(sign),
    );
  }
}
