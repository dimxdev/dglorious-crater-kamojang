'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { locales, localeNames, localeShort } from '@/lib/i18n/config';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className="border-border hover:bg-cream-100 flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span aria-hidden>🌐</span>
        {localeShort[locale]}
      </button>

      {open && (
        <ul
          className="border-border absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border bg-white shadow-lg"
          role="listbox"
        >
          {locales.map((l) => (
            <li key={l}>
              <button
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={cn(
                  'hover:bg-cream-100 flex w-full items-center justify-between px-3 py-2 text-left text-sm',
                  l === locale && 'text-forest-700 font-semibold',
                )}
                role="option"
                aria-selected={l === locale}
              >
                {localeNames[l]}
                <span className="text-muted text-xs">{localeShort[l]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
