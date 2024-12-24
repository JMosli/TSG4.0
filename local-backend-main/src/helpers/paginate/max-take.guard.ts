import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MAX_TAKE_KEY } from './max-take.decorator';
import { PaginateErrors } from './types';

/**
 * Defines maximum allowed take parameter when using pagination
 */
@Injectable()
export class MaxTakeGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const maxTake = this.reflector.getAllAndOverride<number>(MAX_TAKE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!maxTake) {
      return true;
    }
    const {
      query: { take },
    } = context.switchToHttp().getRequest();
    if (!take) throw new BadRequestException(PaginateErrors.NoTake);
    if (take > maxTake)
      throw new BadRequestException(PaginateErrors.SizeExceeded);

    return true;
  }
}
