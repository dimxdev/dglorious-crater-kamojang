'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: t('nav.home') },
    { href: '/tentang', label: t('nav.about') },
    { href: '/penginapan', label: t('nav.lodging') },
    { href: '/cek-booking', label: t('nav.checkBooking') },
  ];

  return (
    <header className="border-border/70 bg-cream-50/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-forest-700 flex h-9 w-9 items-center justify-center rounded-lg text-cream-50">
            🌋
          </span>
          <span className="text-forest-800 font-serif text-lg leading-tight font-semibold">
            D&apos;Glorious
            <span className="text-muted block text-xs font-normal">
              Crater Kamojang
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-foreground hover:text-forest-700 text-sm font-medium transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Link href="/penginapan" className="hidden md:block">
            <Button size="sm">{t('nav.book')}</Button>
          </Link>
          <button
            className="hover:bg-cream-100 rounded-lg p-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            <span className="block text-xl leading-none">{open ? '×' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className={cn(
          'border-border bg-cream-50 border-t md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="hover:bg-cream-100 rounded-lg px-3 py-2 text-sm font-medium"
            >
              {l.label}
            </Link>
          ))}
          <Link href="/penginapan" onClick={() => setOpen(false)} className="mt-2">
            <Button size="sm" fullWidth>
              {t('nav.book')}
            </Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
