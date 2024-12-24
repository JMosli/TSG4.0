import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CommunicatorRequester } from 'communicator/requester';
import { Request } from 'express';
import { CryptoService } from 'src/crypto/crypto.service';
import { RangeService } from 'src/range/range.service';
import { DEBUG_USER } from '../constants';

/**
 * This guard implements signature checking procedure to verify
 * that request is coming from actual global server.
 */
@Injectable()
export class GlobalRequestGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly rangeService: RangeService,
    private readonly cryptoService: CryptoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // The logic here is the same as on global server side

    const request: Request = context.switchToHttp().getRequest();
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );
    const rangeId = request.headers['range-id'];
    const signature = request.headers['signature'];

    if (!signature && process.env.DEBUG_ENABLED === 'true') {
      const auth = request.headers['authorization'];
      const token = auth?.split(' ')?.at(-1);

      if (!isPublic && token !== process.env.DEBUG_ACCESS_KEY) return false;

      request['user'] = DEBUG_USER;
      return true;
    }

    if (isPublic && (!rangeId || !signature)) return true;
    if (!rangeId || !signature) return false;
    if (rangeId instanceof Array || signature instanceof Array) return false;
    if (isNaN(+rangeId)) return false;

    const range = await this.rangeService.getDefault();
    if (!range) return false;

    const signaturePayload = CommunicatorRequester.getSignaturePayload(
      range.global_id.toString(),
      request.path,
      request.body,
    );
    const isSignatureValid = this.cryptoService.verifySignature(
      signaturePayload,
      Buffer.from(signature, 'base64'),
      Buffer.from(range.public_key_checker),
    );

    // Sometimes global server can send us requested user
    if ((isPublic || isSignatureValid) && request.body._internal?.user) {
      request['user'] = { ...request.body._internal.user };
      delete request.body._internal;
    }

    return isSignatureValid || isPublic;
  }
}
