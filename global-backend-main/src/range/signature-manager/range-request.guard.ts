import {
  CanActivate,
  ExecutionContext,
  Injectable,
  RawBodyRequest,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CommunicatorRequester } from 'communicator/requester';
import { Request } from 'express';
import { CryptoService } from 'src/crypto/crypto.service';
import { PrismaService } from 'src/helpers/prisma.service';

/**
 * This guard implements signature checking procedure to verify
 * that request is coming from actual range server.
 *
 * It checks Range-Id header to get range id of the incoming request.
 */
@Injectable()
export class RangeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private readonly cryptoService: CryptoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Extracting range id and signature from signed request
    const request: Request = context.switchToHttp().getRequest();
    const rangeId = request.headers['range-id'];
    const signature = request.headers['signature'];

    // Checking if there is only one instance of the header, range id is a number
    // and they are all present in the request
    if (!rangeId || !signature) return false;
    if (rangeId instanceof Array || signature instanceof Array) return false;
    if (isNaN(+rangeId)) return false;

    const range = await this.prisma.range.findFirst({
      where: { id: +rangeId },
    });
    if (!range) return false;

    // Constructing our signature to compare with incoming
    const signaturePayload = CommunicatorRequester.getSignaturePayload(
      rangeId, // range id extracted from request
      request.path, // requested path
      request.body, // json body of the request (it already passed json middleware)
      // in case of unserializable data (i.e Buffer or multipart/form-data),
      // JSON.stringify(request.body) will become {} and signature will be passed
      // as it is also set to {} by client side
    );
    console.log(signaturePayload);
    const isSignatureValid = this.cryptoService.verifySignature(
      signaturePayload,
      Buffer.from(signature, 'base64'),
      Buffer.from(range.public_key_checker),
    );

    if (isSignatureValid) request['requestedRange'] = { ...range };

    return isSignatureValid;
  }
}
