import type { RoleName } from './types';

/**
 * Landing page right after login, per role (§5 PROJECT.md — arah akses).
 * SUPER_ADMIN "rumahnya" adalah hub navigasi `/super-admin` (bukan Owner) —
 * dia cuma pantau & pindah ke tiap dashboard admin, gak butuh grafik seperti
 * Owner. OWNER tetap ke dashboard Owner-nya sendiri; ADMIN_PENGINAPAN cuma
 * punya satu tempat untuk dituju.
 */
export function roleHomePath(role: RoleName): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return '/super-admin';
    case 'OWNER':
      return '/owner';
    case 'ADMIN_PENGINAPAN':
      return '/admin/penginapan';
    default:
      return '/login';
  }
}
