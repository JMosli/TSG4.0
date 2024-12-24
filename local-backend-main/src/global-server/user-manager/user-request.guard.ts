import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UserContext } from 'src/helpers/types';
import { RangeService } from 'src/range/range.service';
import { ONLY_GLOBAL_ADMIN_KEY } from './global-admin.decorator';

/**
 * Requires to request from global server to come with authenticated user data.
 * Also checks if requesting user owns current default range.
 *
 * Allows global admin to pass owner checks, so global admin can access protected routes.
 */
@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly rangeService: RangeService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const onlyGlobalAdmin = this.reflector.getAllAndOverride<boolean>(
      ONLY_GLOBAL_ADMIN_KEY,
      [context.getHandler(), context.getClass()],
    );
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    const { user }: Request & { user?: UserContext } = context
      .switchToHttp()
      .getRequest();

    if (isPublic) return true;
    if (!user) return false;

    const range = await this.rangeService.getDefault().catch(() => null);
    if (!range) return false;

    if (process.env.DEBUG_ENABLED === 'true') {
      return true;
    }

    // User endpoint can only be accessed by global admin, we just need to check
    // if authenticated user is global admin. Even if user is range owner, we dont
    // need him to access protected endpoint.
    if (onlyGlobalAdmin) return user.is_global_admin;

    return user.is_global_admin || user.is_owner || user.is_sg;
  }
}
