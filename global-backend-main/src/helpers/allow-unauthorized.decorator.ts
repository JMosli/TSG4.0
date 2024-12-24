import { applyDecorators, SetMetadata } from "@nestjs/common";

export const ALLOW_UNAUTHORIZED_KEY = "allow_unauthorized";

/**
 * Sets metadata for AuthGuard to skip exceptions when user is not authorized.
 *
 * Can be used to allow any user to access api endpoint, but control
 * what action it does whatever user authorized or not. For example to allow
 * any user to access public files, but make so that only authorized user can access
 * private file.
 */
export const AllowUnauthorized = () =>
  applyDecorators(SetMetadata(ALLOW_UNAUTHORIZED_KEY, true));
