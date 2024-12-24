import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class InitialKeyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const initialSetup = request.headers['initial-setup'];
    if (!initialSetup) return false;

    return initialSetup === process.env.INITIAL_RANGE_SECRET_KEY;
  }
}
