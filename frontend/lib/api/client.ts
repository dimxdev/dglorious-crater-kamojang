/**
 * Thin fetch wrapper around the NestJS API (§4.1 PROJECT.md — frontend murni
 * fetch ke backend, tidak ada logika bisnis di sini).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiFetchOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Bearer token to attach, if any (auth routes don't need one). */
  token?: string | null;
};

/**
 * Calls the backend and returns the parsed JSON body.
 * Throws `ApiError` on any non-2xx response so callers can branch on
 * `error.status` (e.g. 401 → invalid credentials, 403 → wrong role).
 */
export async function apiFetch<T>(
  path: string,
  { body, token, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204/empty responses (none yet, but keep this resilient).
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message =
      (data && typeof data.message === 'string' && data.message) ||
      (Array.isArray(data?.message) && data.message.join(', ')) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return data as T;
}
