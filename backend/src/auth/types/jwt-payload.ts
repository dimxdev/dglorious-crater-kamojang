import { RoleName } from '../../generated/prisma/enums';

/** Shape of the signed JWT payload. */
export interface JwtPayload {
  /** User id (subject). */
  sub: number;
  email: string;
  role: RoleName;
}

/**
 * User object attached to `request.user` after JWT validation.
 * This is what `@CurrentUser()` returns in controllers.
 */
export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: RoleName;
}
