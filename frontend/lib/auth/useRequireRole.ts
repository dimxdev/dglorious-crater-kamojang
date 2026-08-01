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
 * - Logged in but role not allowed → redirect to that role's own home
 *   (e.g. ADMIN_PENGINAPAN hitting `/owner` bounces back to `/admin/penginapan`).
 * - SUPER_ADMIN always passes (§5 — full access).
 */
export function useRequireRole(allow: RoleName[]): {
  user: AuthUser | null;
  isLoading: boolean;
  isAllowed: boolean;
} {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const isAllowed = !!user && (user.role === 'SUPER_ADMIN' || allow.includes(user.role));

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
