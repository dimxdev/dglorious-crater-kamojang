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
 * SUPER_ADMIN passes every role check (full access, §5 PROJECT.md).
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

    // SUPER_ADMIN can reach everything (§5).
    if (user.role === RoleName.SUPER_ADMIN) {
      return true;
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
