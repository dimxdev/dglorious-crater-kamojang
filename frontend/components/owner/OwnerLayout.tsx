'use client';

import { Mountain } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useAuth } from '@/lib/auth/AuthProvider';
import { roleLabelKey } from '@/lib/auth/roleLabel';
import { useRequireRole } from '@/lib/auth/useRequireRole';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';

type NavItem = {
  href: string;
  icon: string;
  label: string;
  exact?: boolean;
  soon?: boolean;
};

/** Kartu putih bergaya Owner (border krem, radius besar) — dipakai di semua halaman Owner. */
export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('rounded-2xl border border-[#ece6d8] bg-white p-5.5', className)}>
      {children}
    </div>
  );
}

/**
 * Shell dashboard Owner: sidebar + header, dipakai tiap halaman `/owner/*`
 * (route asli, bukan tab-switch di satu komponen). Eksklusif `OWNER` (§5
 * PROJECT.md, revisi 2026-08-21) — SUPER_ADMIN & ADMIN_PENGINAPAN sama-sama
 * dipentalkan balik ke dashboardnya sendiri lewat `roleHome.ts`.
 */
export function OwnerLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { user, isAllowed } = useRequireRole(['OWNER']);

  const navItems: NavItem[] = [
    { href: '/owner', icon: '▦', label: t('owner.navRingkasan'), exact: true },
    { href: '/owner/penginapan', icon: '🛏', label: t('owner.navPenginapan') },
    { href: '/owner/tiket', icon: '🎫', label: t('owner.navTiket'), soon: true },
    { href: '/owner/cafe', icon: '☕', label: t('owner.navCafe'), soon: true },
  ];

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (!user || !isAllowed) {
    return <div className="min-h-screen bg-[#f4f1ea]" />;
  }

  const displayName = user.name;
  const roleLabel = t(roleLabelKey(user.role));

  return (
    <div className="flex min-h-screen bg-[#f4f1ea]">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col bg-[#1a1410] text-[#cbc3b5] md:flex">
        <div className="border-b border-[#D4A04A]/20 px-5.5 py-6">
          <div className="font-serif text-[19px] font-extrabold text-cream-100">
            D&apos;Glorious <span className="text-[#D4A04A]">Crater</span>
          </div>
          <div className="mt-1 text-[11px] tracking-[0.14em] text-[#D4A04A] uppercase">
            {t('owner.portal')}
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {navItems.map((item) => {
            if (item.soon) {
              return (
                <div
                  key={item.href}
                  className="flex cursor-not-allowed items-center gap-3 rounded-[10px] border-l-[3px] border-transparent px-3.5 py-3 text-sm font-medium text-[#7d746a]"
                >
                  <span className="w-4.5 text-center">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  <span className="rounded-[5px] bg-[#D4A04A]/20 px-1.5 py-0.5 text-[9px] font-bold text-[#D4A04A]">
                    SOON
                  </span>
                </div>
              );
            }
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-[10px] border-l-[3px] px-3.5 py-3 text-sm font-medium transition-colors',
                  active
                    ? 'border-[#D4A04A] bg-[#D4A04A]/20 text-white'
                    : 'border-transparent text-[#b8ab9c] hover:bg-[#D4A04A]/10',
                )}
              >
                <span className="w-4.5 text-center">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="m-3 flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-left text-sm font-medium text-[#b8ab9c] hover:bg-[#D4A04A]/10"
        >
          <span className="w-4.5 text-center">⏻</span>
          {t('admin.logout')}
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e8e2d5] bg-[#fbf9f4] px-5 md:bg-white md:px-8">
          <h1 className="text-forest-800 hidden font-serif text-xl font-bold md:block md:text-[22px]">
            {title}
          </h1>
          {/* Brand mark khusus mobile — judul halaman disembunyikan di sana,
              jadi sisi kiri header butuh identitas biar gak kosong. */}
          <Link href="/owner" className="flex items-center gap-2 md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a1410] text-[#D4A04A]">
              <Mountain size={16} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="font-serif text-[15px] leading-tight font-bold text-[#1a1410]">
              D&apos;Glorious <span className="text-[#D4A04A]">Crater</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3.5">
            <LanguageSwitcher />
            <div className="hidden items-center gap-2.5 md:flex">
              <div className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-[#1a1410] text-sm font-bold text-[#D4A04A]">
                {initials(displayName)}
              </div>
              <div>
                <div className="text-[13.5px] leading-tight font-semibold">{displayName}</div>
                <div className="mt-0.5 inline-block rounded-full bg-[#f6ecd8] px-2 py-0.5 text-[11px] text-[#9a7420]">
                  {roleLabel}
                </div>
              </div>
            </div>
            {/* Sidebar (dengan tombol Keluar-nya) hilang total di mobile — akun +
                logout dipindah ke dropdown lewat avatar biar header gak penuh. */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-[#1a1410] text-sm font-bold text-[#D4A04A]"
              >
                {initials(displayName)}
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute top-12 right-0 z-40 w-44 rounded-xl border border-[#ece6d8] bg-white p-2 shadow-lg">
                    <div className="px-2.5 py-2">
                      <div className="text-[13px] leading-tight font-semibold">{displayName}</div>
                      <div className="mt-1 inline-block rounded-full bg-[#f6ecd8] px-2 py-0.5 text-[11px] text-[#9a7420]">
                        {roleLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-muted-strong mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium hover:bg-[#f6ecd8]/60"
                    >
                      <span>⏻</span>
                      {t('admin.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* Bottom nav — pengganti sidebar khusus mobile (sidebar `hidden` total di bawah breakpoint md). */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t border-[#e8e2d5] bg-white/95 px-2 pt-2 shadow-[0_-4px_16px_rgba(26,20,16,0.07)] backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        {navItems.map((item) => {
          if (item.soon) {
            return (
              <div
                key={item.href}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[#c9c2b4]"
              >
                <span className="text-[19px] leading-none">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            );
          }
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold transition-colors',
                active ? 'bg-[#D4A04A]/15 text-[#9a7420]' : 'text-muted hover:bg-[#f4f1ea]',
              )}
            >
              <span className={cn('text-[19px] leading-none transition-transform', active && 'scale-110')}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
