import type { RoleName } from './types';

/** Human-readable role name for header badges, keyed by i18n `roles.*`. */
export function roleLabelKey(role: RoleName): string {
  return `roles.${role}`;
}
