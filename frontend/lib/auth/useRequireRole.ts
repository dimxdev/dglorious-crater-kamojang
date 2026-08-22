'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { roleHomePath } from './roleHome';
import type { AuthUser, RoleName } from './types';

/**
 * Client-side route guard for dashboard layouts.
 *
 * NOTE (§4.2 PROJECT.md): this is UX only — it just hides pages the user
 * shouldn't see. The real access control is the backend's `RolesGuard`;
 * nothing here is a security boundary.
 *
 * - Not logged in → redirect to `/login`.
 * - Logged in but role not in `allow` → redirect to that role's own home
 *   (e.g. ADMIN_PENGINAPAN hitting `/owner` bounces back to `/admin/penginapan`).
 *
 * No blanket SUPER_ADMIN bypass — every caller must list the roles it wants
 * to let through explicitly (§5 PROJECT.md, revised 2026-08-21: SUPER_ADMIN
 * reaches every ADMIN dashboard but NOT the Owner dashboard, which is
 * exclusive to `OWNER`).
 */
export function useRequireRole(allow: RoleName[]): {
  user: AuthUser | null;
  isLoading: boolean;
  isAllowed: boolean;
} {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAllowed = !!user && allow.includes(user.role);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!isAllowed) {
      router.replace(roleHomePath(user.role));
    }
  }, [isLoading, user, isAllowed, router]);

  return { user, isLoading, isAllowed };
}
