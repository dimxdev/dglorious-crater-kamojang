export const locales = ['id', 'en', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'id';

export const localeNames: Record<Locale, string> = {
  id: 'Indonesia',
  en: 'English',
  zh: '中文',
};

/** Label pendek untuk switcher. */
export const localeShort: Record<Locale, string> = {
  id: 'ID',
  en: 'EN',
  zh: '中',
};

export const LOCALE_STORAGE_KEY = 'dgc.locale';
