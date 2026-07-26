'use client';

import { Menu, Mountain, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = [
    { href: '/', label: t('nav.home'), exact: true },
    { href: '/tentang', label: t('nav.about') },
    { href: '/penginapan', label: t('nav.lodging') },
  ];

  const isActive = (l: { href: string; exact?: boolean }) =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href);

  return (
    <header className="border-border/70 sticky top-0 z-40 border-b bg-stone-50/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="bg-basalt-800 flex h-9 w-9 items-center justify-center rounded-lg text-stone-50">
            <Mountain size={18} strokeWidth={1.5} aria-hidden />
          </span>
          <span className="text-basalt-900 font-serif text-lg leading-tight font-semibold">
            D&apos;Glorious
            <span className="text-muted block text-xs font-normal">
              Crater Kamojang
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-full px-3.5 py-2 text-sm font-medium transition-colors',
                isActive(l)
                  ? 'bg-teal-600/10 font-semibold text-teal-700'
                  : 'text-foreground hover:bg-stone-100 hover:text-teal-600',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-stone-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
          >
            {open ? (
              <X size={20} strokeWidth={1.5} aria-hidden />
            ) : (
              <Menu size={20} strokeWidth={1.5} aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <nav
        className={cn(
          'border-border border-t bg-stone-50 md:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div className="flex flex-col gap-1 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(l) ? 'bg-teal-600/10 font-semibold text-teal-700' : 'hover:bg-stone-100',
              )}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
