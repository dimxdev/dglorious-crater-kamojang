'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiFetch } from '@/lib/api/client';
import type { AuthUser, LoginResponse } from './types';

const TOKEN_STORAGE_KEY = 'dgc_auth_token';

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  /** True while restoring the session from localStorage on first load. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Session state for the whole app. Token lives in localStorage + is sent as
 * `Authorization: Bearer <token>` (chosen over httpOnly cookies for this
 * project — see FASE 2 discussion). On mount, any stored token is re-verified
 * against `GET /auth/me` so a revoked/expired token doesn't leave a stale
 * "logged in" UI.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    apiFetch<AuthUser>('/auth/me', { token: stored })
      .then((me) => {
        setToken(stored);
        setUser(me);
      })
      .catch(() => {
        // Token expired/invalid/user deleted — drop it silently.
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    window.localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
    setToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus dipakai di dalam <AuthProvider>');
  }
  return ctx;
}
