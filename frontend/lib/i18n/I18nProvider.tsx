'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from 'react';
import { defaultLocale, LOCALE_STORAGE_KEY, type Locale, locales } from './config';
import { dictionaries } from './dictionaries';

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Ambil teks berdasarkan key bertitik, mis. t('nav.home'). Fallback ke ID.
   *  Params opsional mengganti token {nama} di dalam teks. */
  t: (key: string, params?: Record<string, string | number>) => string;
};

const localeListeners = new Set<() => void>();

function subscribeLocale(listener: () => void) {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

function getStoredLocale(): Locale {
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored && locales.includes(stored as Locale)
    ? (stored as Locale)
    : defaultLocale;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Telusuri object bersarang dengan path "a.b.c". */
function lookup(dict: unknown, key: string): string | undefined {
  const value = key.split('.').reduce<unknown>((acc, part) => {
    if (acc && typeof acc === 'object' && part in acc) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === 'string' ? value : undefined;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Server & hidrasi memakai defaultLocale; setelah mount React membaca
  // preferensi tersimpan dari localStorage (tanpa mismatch hidrasi).
  const locale = useSyncExternalStore(
    subscribeLocale,
    getStoredLocale,
    () => defaultLocale,
  );

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    localeListeners.forEach((l) => l());
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const raw =
        lookup(dictionaries[locale], key) ??
        lookup(dictionaries[defaultLocale], key) ??
        key;
      if (!params) return raw;
      return raw.replace(/\{(\w+)\}/g, (_, k: string) =>
        k in params ? String(params[k]) : `{${k}}`,
      );
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useTranslation harus dipakai di dalam <I18nProvider>');
  }
  return ctx;
}
