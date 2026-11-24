import type { RoleName } from '@/lib/auth/types';
import { apiFetch } from './client';

/** Mirror `UserListItem` di backend/src/users/users.service.ts. Password tidak pernah dikirim. */
export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: RoleName;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateUserInput = {
  name: string;
  email: string;
  role: RoleName;
  password: string;
};

export type UpdateUserInput = Partial<{
  name: string;
  email: string;
  role: RoleName;
  isActive: boolean;
}>;

export function fetchUsers(token: string) {
  return apiFetch<AdminUser[]>('/admin/users', { token });
}

export function createUser(token: string, body: CreateUserInput) {
  return apiFetch<AdminUser>('/admin/users', { method: 'POST', token, body });
}

export function updateUser(token: string, id: number, body: UpdateUserInput) {
  return apiFetch<AdminUser>(`/admin/users/${id}`, { method: 'PATCH', token, body });
}

export function resetUserPassword(token: string, id: number, password: string) {
  return apiFetch<{ ok: true }>(`/admin/users/${id}/password`, {
    method: 'PATCH',
    token,
    body: { password },
  });
}

export function deleteUser(token: string, id: number) {
  return apiFetch<{ ok: true }>(`/admin/users/${id}`, { method: 'DELETE', token });
}

/** Ganti kata sandi akun sendiri, berlaku untuk semua role. */
export function changeOwnPassword(token: string, currentPassword: string, newPassword: string) {
  return apiFetch<{ ok: true }>('/auth/password', {
    method: 'PATCH',
    token,
    body: { currentPassword, newPassword },
  });
}
