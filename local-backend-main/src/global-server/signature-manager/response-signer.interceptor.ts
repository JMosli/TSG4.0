import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { CommunicatorRequester } from 'communicator/requester';
import { Request, Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { CryptoService } from 'src/crypto/crypto.service';
import { rebuildError } from 'src/helpers/error.filter';
import { RangeService } from 'src/range/range.service';

/**
 * This class intercepts response object and adds Signature and Range-Id headers to it.
 */
@Injectable()
export class SignerInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(
    private readonly cryptoService: CryptoService,
    private readonly rangeService: RangeService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<Response<T>>> {
    const response: Response = context.switchToHttp().getResponse();
    const request: Request = context.switchToHttp().getRequest();
    const range = await this.rangeService.getDefault();
    const sign = async (data) => {
      const signaturePayload = CommunicatorRequester.getSignaturePayload(
        range.global_id.toString(),
        request.path,
        data ?? {},
      );
      const signature = this.cryptoService.createSignature(
        signaturePayload,
        range.private_key_signer,
      );

      response.setHeader('Signature', signature.toString('base64'));
      response.setHeader('Range-Id', range.global_id.toString());
    };

    return next.handle().pipe(
      catchError((err, caught) => {
        sign(rebuildError(err.response));
        return throwError(() => err);
      }),
      tap(sign),
    );
  }
}
