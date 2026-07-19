import type { Locale } from './config';
import id from './locales/id.json';
import en from './locales/en.json';
import zh from './locales/zh.json';

/** Kamus bersarang; daun selalu string. EN/ZH boleh parsial (fallback ke ID). */
export type Dictionary = { [key: string]: string | Dictionary };

export const dictionaries: Record<Locale, Dictionary> = { id, en, zh };
