import type { RoleName } from './types';

/**
 * Landing page right after login, per role (§5 PROJECT.md — arah akses).
 * OWNER/SUPER_ADMIN "rumahnya" adalah dashboard Owner (bisa turun ke Admin
 * lewat menu, lihat TASK.md FASE 10 "Gateway navigasi" — sengaja ditunda);
 * ADMIN_PENGINAPAN cuma punya satu tempat untuk dituju.
 */
export function roleHomePath(role: RoleName): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'OWNER':
      return '/owner';
    case 'ADMIN_PENGINAPAN':
      return '/admin/penginapan';
    // Fase berikutnya — belum ada dashboard sendiri, jangan sampai 404.
    case 'ADMIN_PORTAL':
    case 'ADMIN_CAFFE':
      return '/login';
    default:
      return '/login';
  }
}
