// Fase 1: Indonesia (ID) + Inggris (EN).
// Mandarin (中文) digeser ke fase berikutnya (PROJECT.md §9) — file zh.json &
// struktur i18n tetap disiapkan, tinggal menambah 'zh' ke daftar ini saat aktif.
export const locales = ['id', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'id';

/** Label di daftar switcher. Ditulis dalam bahasanya masing-masing supaya
 *  orang yang belum paham bahasa aktif tetap bisa mengenali pilihannya —
 *  sengaja dijaga sependek mungkin, karena bendera di sampingnya sudah
 *  membawa identitas visualnya. */
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
