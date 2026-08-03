import { apiFetch } from './client';

/**
 * Global config (jam operasional, no. WA, rekening, S&K) — §4.6/§8.3
 * PROJECT.md: must come from the backend `settings` table, never hardcoded.
 * Flat `{key: value}` object; `terms_conditions_id`/`terms_conditions_en`
 * are separate keys because `Setting.value` isn't per-language.
 */
export function fetchPublicSettings() {
  return apiFetch<Record<string, string>>('/settings');
}
