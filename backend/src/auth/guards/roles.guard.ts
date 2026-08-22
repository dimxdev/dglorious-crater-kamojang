import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RoleName } from '../../generated/prisma/enums';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../types/jwt-payload';

/**
 * Enforces `@Roles(...)` metadata. Must run AFTER JwtAuthGuard so that
 * `request.user` is already populated.
 *
 * No blanket SUPER_ADMIN bypass (§5 PROJECT.md, revised 2026-08-21) — every
 * protected route must list the roles it wants to admit explicitly. All
 * current `@Roles(...)` usages already include `RoleName.SUPER_ADMIN`
 * alongside `OWNER`/`ADMIN_PENGINAPAN`, so this tightening changes nothing
 * for existing endpoints; it only stops a *future* owner-only endpoint from
 * accidentally admitting SUPER_ADMIN too.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() on the route → JWT alone is enough.
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
