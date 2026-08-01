'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export type AdminNavItem = {
  href: string;
  label: string;
  /** Label pendek khusus bottom nav mobile — label panjang ("Kelola
   *  Penginapan") gak muat di tab selebar ~70px. */
  shortLabel: string;
  icon: string;
  exact?: boolean;
};

/** Sumber tunggal menu Admin — dipakai bareng sidebar desktop & bottom nav mobile. */
export function useAdminNavItems(): AdminNavItem[] {
  const { t } = useTranslation();
  return [
    {
      href: '/admin/penginapan',
      label: t('dashboard.overview'),
      shortLabel: t('dashboard.navShortOverview'),
      icon: '📊',
      exact: true,
    },
    {
      href: '/admin/penginapan/booking-whatsapp',
      label: t('dashboard.bookingWhatsapp'),
      shortLabel: t('dashboard.navShortWhatsapp'),
      icon: '💬',
    },
    {
      href: '/admin/penginapan/walk-in',
      label: t('dashboard.walkin'),
      shortLabel: t('dashboard.navShortWalkin'),
      icon: '🚶',
    },
    {
      href: '/admin/penginapan/booking',
      label: t('dashboard.bookings'),
      shortLabel: t('dashboard.navShortBookings'),
      icon: '📋',
    },
    {
      href: '/admin/penginapan/kelola',
      label: t('dashboard.manage'),
      shortLabel: t('dashboard.navShortManage'),
      icon: '🏕️',
    },
  ];
}

/**
 * Cek menu aktif. Sengaja pakai `href + '/'`, BUKAN `startsWith(href)` polos —
 * kalau polos, `/admin/penginapan/booking-whatsapp` juga bikin menu "Data
 * Booking" (`/admin/penginapan/booking`) ikut nyala barengan.
 */
export function isAdminNavActive(item: AdminNavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function Sidebar({ className }: { className?: string }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const items = useAdminNavItems();

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen w-62 shrink-0 flex-col bg-[#14352A] text-[#cbd8cf]',
        className,
      )}
    >
      {/* Brand */}
      <div className="border-b border-cream-100/10 px-5.5 py-6">
        <div className="font-serif text-[19px] font-extrabold text-cream-100">
          D&apos;Glorious <span className="text-terracotta-500">Crater</span>
        </div>
        <div className="mt-1 text-[11px] tracking-[0.14em] uppercase opacity-55">
          {t('admin.console')}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active = isAdminNavActive(item, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-[10px] border-l-[3px] px-3.5 py-3 text-sm font-medium transition-colors',
                active
                  ? 'border-terracotta-500 bg-cream-100/[0.07] text-white'
                  : 'border-transparent text-[#cbd8cf]/80 hover:bg-cream-100/5 hover:text-white',
              )}
            >
              <span className="w-4.5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        type="button"
        onClick={() => {
          logout();
          router.push('/login');
        }}
        className="m-3 flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-left text-sm font-medium text-[#9fb0a6] hover:bg-cream-100/5"
      >
        <span className="w-4.5 text-center">⏻</span>
        {t('admin.logout')}
      </button>
    </aside>
  );
}
