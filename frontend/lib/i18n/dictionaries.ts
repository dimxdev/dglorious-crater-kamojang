import type { Locale } from './config';
import id from './locales/id.json';
import en from './locales/en.json';

/** Kamus bersarang; daun selalu string. EN boleh parsial (fallback ke ID). */
export type Dictionary = { [key: string]: string | Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { id, en };
