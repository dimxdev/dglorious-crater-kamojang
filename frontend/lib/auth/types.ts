/** Mirrors backend/src/generated/prisma/enums.ts → RoleName. */
export type RoleName =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'ADMIN_PENGINAPAN'
  | 'ADMIN_PORTAL'
  | 'ADMIN_CAFFE';

/** Mirrors backend AuthUser (backend/src/auth/types/jwt-payload.ts). */
export type AuthUser = {
  id: number;
  email: string;
  name: string;
  role: RoleName;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};
