import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserContext } from '../types';

/**
 * Checks if request was made by authorized global admin.
 * Requires AuthGuard to be applied to the endpoint
 */
@Injectable()
export class GlobalAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user }: { user: UserContext } = context.switchToHttp().getRequest();

    return user.is_global_admin;
  }
}
