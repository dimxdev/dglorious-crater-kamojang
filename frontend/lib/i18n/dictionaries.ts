import type { Locale } from './config';
import id from './locales/id.json';
import en from './locales/en.json';

// zh.json sengaja TIDAK diimpor di fase 1 — Mandarin digeser ke fase berikutnya
// (PROJECT.md §9). Filenya tetap ada, tinggal ditambahkan di sini saat aktif.

/** Kamus bersarang; daun selalu string. EN boleh parsial (fallback ke ID). */
export type Dictionary = { [key: string]: string | Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { id, en };
