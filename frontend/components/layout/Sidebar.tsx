'use client';

import {
  ClipboardList,
  Footprints,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export type AdminNavItem = {
  href: string;
  label: string;
  /** Label pendek khusus bottom nav mobile — label panjang ("Kelola
   *  Penginapan") gak muat di tab selebar ~70px. */
  shortLabel: string;
  icon: LucideIcon;
  exact?: boolean;
};

const SIDEBAR_COLLAPSED_KEY = 'dgc_sidebar_collapsed';

const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(listener: () => void) {
  collapsedListeners.add(listener);
  return () => {
    collapsedListeners.delete(listener);
  };
}

function getCollapsed() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
}

/** Sumber tunggal menu Admin — dipakai bareng sidebar desktop & bottom nav mobile. */
export function useAdminNavItems(): AdminNavItem[] {
  const { t } = useTranslation();
  return [
    {
      href: '/admin/penginapan',
      label: t('dashboard.overview'),
      shortLabel: t('dashboard.navShortOverview'),
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: '/admin/penginapan/reservasi-baru',
      label: t('dashboard.reservasiBaru'),
      shortLabel: t('dashboard.navShortReservasi'),
      icon: MessageCircle,
    },
    {
      href: '/admin/penginapan/tamu-langsung',
      label: t('dashboard.tamuLangsung'),
      shortLabel: t('dashboard.navShortLangsung'),
      icon: Footprints,
    },
    {
      href: '/admin/penginapan/reservasi',
      label: t('dashboard.reservations'),
      shortLabel: t('dashboard.navShortReservations'),
      icon: ClipboardList,
    },
  ];
}

/**
 * Cek menu aktif. Sengaja pakai `href + '/'`, BUKAN `startsWith(href)` polos —
 * kalau polos, `/admin/penginapan/reservasi-baru` juga bikin menu "Data
 * Reservasi" (`/admin/penginapan/reservasi`) ikut nyala barengan.
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
  // Server selalu render versi expanded; preferensi tersimpan dibaca setelah
  // hidrasi lewat useSyncExternalStore (tanpa mismatch SSR/klien).
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    getCollapsed,
    () => false,
  );

  function toggleCollapsed() {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '0' : '1');
    collapsedListeners.forEach((l) => l());
  }

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col bg-green-800 text-green-100 transition-[width] duration-200',
        collapsed ? 'w-18' : 'w-62',
        className,
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          'flex items-center border-b border-white/10 px-5.5 py-6',
          collapsed && 'justify-center px-0',
        )}
      >
        {collapsed ? (
          <span className="font-serif text-xl font-extrabold text-stone-50">D</span>
        ) : (
          <div>
            <div className="font-serif text-[19px] font-extrabold text-stone-50">
              D&apos;Glorious <span className="text-orange-500">Crater</span>
            </div>
            <div className="mt-1 text-[11px] tracking-[0.14em] uppercase opacity-55">
              {t('admin.console')}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active = isAdminNavActive(item, pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 rounded-[10px] border-l-[3px] px-3.5 py-3 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                active
                  ? 'border-orange-500 bg-white/[0.07] text-white'
                  : 'border-transparent text-green-100/75 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon size={18} strokeWidth={1.75} className="shrink-0" aria-hidden />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggleCollapsed}
        title={collapsed ? t('admin.expandSidebar') : t('admin.collapseSidebar')}
        className={cn(
          'mx-3 mb-1 flex items-center gap-3 rounded-[10px] px-3.5 py-2.5 text-left text-sm font-medium text-green-100/55 transition-colors hover:bg-white/5 hover:text-white',
          collapsed && 'justify-center px-0',
        )}
      >
        {collapsed ? (
          <PanelLeftOpen size={18} strokeWidth={1.75} className="shrink-0" aria-hidden />
        ) : (
          <PanelLeftClose size={18} strokeWidth={1.75} className="shrink-0" aria-hidden />
        )}
        {!collapsed && t('admin.collapseSidebar')}
      </button>

      {/* Ganti kata sandi */}
      <Link
        href="/akun/kata-sandi"
        title={collapsed ? t('account.changePassword') : undefined}
        aria-label={collapsed ? t('account.changePassword') : undefined}
        className={cn(
          'mx-3 mb-1 flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-left text-sm font-medium text-green-200/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-green-300 focus-visible:outline-none',
          collapsed && 'justify-center px-0',
        )}
      >
        <KeyRound size={18} strokeWidth={1.75} className="shrink-0" aria-hidden />
        {!collapsed && t('account.changePassword')}
      </Link>

      {/* Logout */}
      <button
        type="button"
        onClick={() => {
          logout();
          router.push('/login');
        }}
        title={collapsed ? t('admin.logout') : undefined}
        className={cn(
          'm-3 mt-0 flex items-center gap-3 rounded-[10px] px-3.5 py-3 text-left text-sm font-medium text-green-200/70 transition-colors hover:bg-white/5 hover:text-white',
          collapsed && 'justify-center px-0',
        )}
      >
        <LogOut size={18} strokeWidth={1.75} className="shrink-0" aria-hidden />
        {!collapsed && t('admin.logout')}
      </button>
    </aside>
  );
}
