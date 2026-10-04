'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { locales, localeNames, localeShort } from '@/lib/i18n/config';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { LocaleFlag } from './LocaleFlag';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Tutup saat klik di luar / tekan Escape. Memakai pointerdown pada dokumen
  // (bukan onBlur pada tombol) supaya tidak ada race yang meng-unmount opsi
  // sebelum klik-nya selesai — itu bug yang bikin ganti bahasa "tidak jalan".
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'border-border flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition-colors',
          open ? 'bg-stone-100' : 'hover:bg-stone-100',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={localeNames[locale]}
      >
        <LocaleFlag locale={locale} />
        {localeShort[locale]}
      </button>

      {open && (
        <ul
          className="border-border absolute right-0 z-20 mt-1.5 w-36 overflow-hidden rounded-xl border bg-white p-1 shadow-lg"
          role="listbox"
        >
          {locales.map((l) => {
            const active = l === locale;
            return (
              <li key={l}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(l);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    active
                      ? 'bg-green-50 font-semibold text-green-800'
                      : 'hover:bg-stone-100',
                  )}
                  role="option"
                  aria-selected={active}
                >
                  <LocaleFlag locale={l} />
                  <span className="truncate">{localeNames[l]}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
