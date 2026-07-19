'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
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
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // Baca preferensi tersimpan setelah mount (hindari mismatch hidrasi).
  useEffect(() => {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && locales.includes(stored as Locale)) {
      setLocaleState(stored as Locale);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
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
