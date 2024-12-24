import { applyDecorators, SetMetadata } from '@nestjs/common';

export const ONLY_GLOBAL_ADMIN_KEY = 'only_global_admin';

/**
 * Sets metadata for UserGuard to allow only global admin to access endpoint.
 */
export const OnlyGlobalAdmin = () =>
  applyDecorators(SetMetadata(ONLY_GLOBAL_ADMIN_KEY, true));
