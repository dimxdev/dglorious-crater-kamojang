'use client';

import { Mountain } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { roleLabelKey } from '@/lib/auth/roleLabel';
import { useRequireRole } from '@/lib/auth/useRequireRole';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';
import { isAdminNavActive, Sidebar, useAdminNavItems } from './Sidebar';

type DashboardLayoutProps = {
  title: string;
  children: React.ReactNode;
};

/**
 * Layout dashboard admin: sidebar (desktop) / bottom nav (mobile) + header + konten.
 * Diperbolehkan untuk SUPER_ADMIN, OWNER (bisa turun ke dashboard admin, §5
 * PROJECT.md), dan ADMIN_PENGINAPAN. Redirect ke /login kalau belum masuk.
 */
export function DashboardLayout({ title, children }: DashboardLayoutProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const navItems = useAdminNavItems();
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();
  const { user, isAllowed } = useRequireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN_PENGINAPAN']);

  function handleLogout() {
    logout();
    router.push('/login');
  }

  // Belum tervalidasi / lagi diarahkan ke tempat lain — jangan kedip-kedip
  // nampilin dashboard sebelum redirect dari useRequireRole kelar jalan.
  if (!user || !isAllowed) {
    return <div className="min-h-screen bg-[#f4f1ea]" />;
  }

  const displayName = user.name;
  const roleLabel = t(roleLabelKey(user.role));

  return (
    <div className="flex min-h-screen bg-[#f4f1ea]">
      <Sidebar className="hidden md:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-[#fbfaf7] px-5 md:bg-white md:px-8">
          <h1 className="text-forest-800 hidden font-serif text-xl font-bold md:block md:text-[22px]">
            {title}
          </h1>
          {/* Brand mark khusus mobile — judul halaman disembunyikan di sana,
              jadi sisi kiri header butuh identitas biar gak kosong. */}
          <Link href="/admin/penginapan" className="flex items-center gap-2 md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#14352A] text-white">
              <Mountain size={16} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="font-serif text-[15px] leading-tight font-bold text-[#14352A]">
              D&apos;Glorious <span className="text-terracotta-500">Crater</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-3.5">
            <LanguageSwitcher />
            <span className="hidden cursor-pointer text-xl sm:inline">🔔</span>
            <div className="hidden items-center gap-2.5 md:flex">
              <div className="bg-forest-700 flex h-9.5 w-9.5 items-center justify-center rounded-full text-sm font-bold text-white">
                {initials(displayName)}
              </div>
              <div>
                <div className="text-[13.5px] leading-tight font-semibold">{displayName}</div>
                <div className="mt-0.5 inline-block rounded-full bg-[#E4F1E7] px-2 py-0.5 text-[11px] text-[#2f6b41]">
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
                className="bg-forest-700 flex h-9.5 w-9.5 items-center justify-center rounded-full text-sm font-bold text-white"
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
                  <div className="absolute top-12 right-0 z-40 w-44 rounded-xl border border-[#e6e1d5] bg-white p-2 shadow-lg">
                    <div className="px-2.5 py-2">
                      <div className="text-[13px] leading-tight font-semibold">{displayName}</div>
                      <div className="mt-1 inline-block rounded-full bg-[#E4F1E7] px-2 py-0.5 text-[11px] text-[#2f6b41]">
                        {roleLabel}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-muted-strong mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium hover:bg-[#E4F1E7]/60"
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
        className="fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t border-[#e2dccb] bg-white/95 px-2 pt-2 shadow-[0_-4px_16px_rgba(20,53,42,0.07)] backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        {navItems.map((item) => {
          const active = isAdminNavActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold transition-colors',
                active ? 'bg-[#E4F1E7] text-[#2f6b41]' : 'text-muted hover:bg-[#f4f1ea]',
              )}
            >
              <span
                className={cn('text-[19px] leading-none transition-transform', active && 'scale-110')}
              >
                {item.icon}
              </span>
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
