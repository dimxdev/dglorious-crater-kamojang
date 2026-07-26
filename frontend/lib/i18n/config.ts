// Fase 1: Indonesia (ID) + Inggris (EN).
// Mandarin (中文) digeser ke fase berikutnya (PROJECT.md §9) — file zh.json &
// struktur i18n tetap disiapkan, tinggal menambah 'zh' ke daftar ini saat aktif.
export const locales = ['id', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'id';

export const localeNames: Record<Locale, string> = {
  id: 'Indonesia',
  en: 'English',
};

/** Label pendek untuk switcher. */
export const localeShort: Record<Locale, string> = {
  id: 'ID',
  en: 'EN',
};

export const LOCALE_STORAGE_KEY = 'dgc.locale';
