import { SetMetadata } from '@nestjs/common';
import { RoleName } from '../../generated/prisma/enums';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route (or controller) to the given roles.
 * Must be combined with `@UseGuards(JwtAuthGuard, RolesGuard)`.
 *
 * Example: `@Roles('OWNER', 'SUPER_ADMIN')`
 */
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
