import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AuthUser } from '../types/jwt-payload';

/**
 * Injects the authenticated user (set by JwtStrategy) into a handler param.
 * Only valid on routes protected by `JwtAuthGuard`.
 *
 * Example: `me(@CurrentUser() user: AuthUser)`
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AuthUser;
  },
);
