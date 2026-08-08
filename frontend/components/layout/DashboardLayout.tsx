'use client';

import { LogOut, Mountain } from 'lucide-react';
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
    return <div className="bg-background min-h-screen" />;
  }

  const displayName = user.name;
  const roleLabel = t(roleLabelKey(user.role));

  return (
    <div className="bg-background flex min-h-screen">
      <Sidebar className="hidden md:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-stone-50 px-5 md:bg-white md:px-8">
          <h1 className="text-green-800 hidden font-serif text-xl font-bold md:block md:text-[22px]">
            {title}
          </h1>
          {/* Brand mark khusus mobile — judul halaman disembunyikan di sana,
              jadi sisi kiri header butuh identitas biar gak kosong. */}
          <Link href="/admin/penginapan" className="flex items-center gap-2 md:hidden">
            <span className="bg-green-800 flex h-8 w-8 items-center justify-center rounded-lg text-white">
              <Mountain size={16} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="font-serif text-[15px] leading-tight font-bold text-green-800">
              D&apos;Glorious <span className="text-orange-500">Crater</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-3.5">
            <LanguageSwitcher />
            <div className="hidden items-center gap-2.5 md:flex">
              <div className="bg-green-700 flex h-9.5 w-9.5 items-center justify-center rounded-full text-sm font-bold text-white">
                {initials(displayName)}
              </div>
              <div>
                <div className="text-[13.5px] leading-tight font-semibold">{displayName}</div>
                <div className="text-muted text-[11.5px] leading-tight">{roleLabel}</div>
              </div>
            </div>

            {/* Sidebar (dengan tombol Keluar-nya) hilang total di mobile — akun +
                logout dipindah ke dropdown lewat avatar biar header gak penuh. */}
            <div className="relative md:hidden">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="bg-green-700 flex h-9.5 w-9.5 items-center justify-center rounded-full text-sm font-bold text-white"
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
                  <div className="border-border absolute top-12 right-0 z-40 w-44 rounded-xl border bg-white p-2 shadow-lg">
                    <div className="px-2.5 py-2">
                      <div className="text-[13px] leading-tight font-semibold">{displayName}</div>
                      <div className="text-muted mt-0.5 text-[11.5px] leading-tight">{roleLabel}</div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="text-muted-strong hover:bg-green-50 mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium"
                    >
                      <LogOut size={16} strokeWidth={1.75} aria-hidden />
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
        className="border-border fixed inset-x-0 bottom-0 z-40 flex gap-1 border-t bg-white/95 px-2 pt-2 shadow-[0_-4px_16px_rgba(20,53,42,0.07)] backdrop-blur md:hidden"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        {navItems.map((item) => {
          const active = isAdminNavActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold transition-colors',
                active ? 'bg-green-50 text-green-700' : 'text-muted hover:bg-background',
              )}
            >
              <Icon
                size={19}
                strokeWidth={1.75}
                className={cn('transition-transform', active && 'scale-110')}
                aria-hidden
              />
              <span>{item.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
