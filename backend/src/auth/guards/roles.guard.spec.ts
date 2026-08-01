import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleName } from '../../generated/prisma/enums';
import { AuthUser } from '../types/jwt-payload';
import { RolesGuard } from './roles.guard';

/**
 * Verifies the RBAC criterion in TASK.md FASE 2:
 * "Admin penginapan TIDAK bisa mengakses endpoint role lain (403)."
 */
describe('RolesGuard', () => {
  const makeContext = (user?: AuthUser): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  const makeGuard = (requiredRoles?: RoleName[]) => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector;
    return new RolesGuard(reflector);
  };

  const user = (role: RoleName): AuthUser => ({
    id: 1,
    email: 'x@dglorious.com',
    name: 'X',
    role,
  });

  it('allows any authenticated user when no @Roles is set', () => {
    const guard = makeGuard(undefined);
    expect(
      guard.canActivate(makeContext(user(RoleName.ADMIN_PENGINAPAN))),
    ).toBe(true);
  });

  it('allows a user whose role is in the required list', () => {
    const guard = makeGuard([RoleName.OWNER]);
    expect(guard.canActivate(makeContext(user(RoleName.OWNER)))).toBe(true);
  });

  it('rejects a user whose role is NOT in the required list (403)', () => {
    const guard = makeGuard([RoleName.OWNER]);
    expect(() =>
      guard.canActivate(makeContext(user(RoleName.ADMIN_PENGINAPAN))),
    ).toThrow(ForbiddenException);
  });

  it('lets SUPER_ADMIN through every role check', () => {
    const guard = makeGuard([RoleName.OWNER]);
    expect(guard.canActivate(makeContext(user(RoleName.SUPER_ADMIN)))).toBe(
      true,
    );
  });

  it('rejects when there is no authenticated user (403)', () => {
    const guard = makeGuard([RoleName.OWNER]);
    expect(() => guard.canActivate(makeContext(undefined))).toThrow(
      ForbiddenException,
    );
  });
});
