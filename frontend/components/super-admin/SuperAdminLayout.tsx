'use client';

import {
  ChevronRight,
  ExternalLink,
  FileText,
  Home,
  Images,
  Info,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Mountain,
  Phone,
  Settings,
  Tent,
  Ticket,
  Trees,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useAuth } from '@/lib/auth/AuthProvider';
import { roleLabelKey } from '@/lib/auth/roleLabel';
import { useRequireRole } from '@/lib/auth/useRequireRole';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { DirtyProvider, useDirtyState } from './cms/dirty';

type NavItem = { href: string; icon: LucideIcon; label: string; exact?: boolean };
type NavGroup = { label: string | null; items: NavItem[] };

function useSuperNav(): NavGroup[] {
  const { t } = useTranslation();
  return [
    {
      label: null,
      items: [
        { href: '/super-admin', icon: LayoutDashboard, label: t('superAdmin.nav.overview'), exact: true },
      ],
    },
    {
      label: t('superAdmin.nav.groupContent'),
      items: [
        { href: '/super-admin/konten/beranda', icon: Home, label: t('superAdmin.nav.home') },
        { href: '/super-admin/konten/tentang', icon: Info, label: t('superAdmin.nav.about') },
        { href: '/super-admin/konten/atraksi', icon: Trees, label: t('superAdmin.nav.attractions') },
        { href: '/super-admin/konten/tiket', icon: Ticket, label: t('superAdmin.nav.tickets') },
        { href: '/super-admin/konten/galeri', icon: Images, label: t('superAdmin.nav.gallery') },
        { href: '/super-admin/konten/kontak', icon: Phone, label: t('superAdmin.nav.contact') },
        { href: '/super-admin/konten/halaman', icon: FileText, label: t('superAdmin.nav.pages') },
      ],
    },
    {
      label: t('superAdmin.nav.groupLodging'),
      items: [{ href: '/super-admin/penginapan', icon: Tent, label: t('superAdmin.nav.rooms') }],
    },
    {
      label: t('superAdmin.nav.groupSystem'),
      items: [
        { href: '/super-admin/pengaturan', icon: Settings, label: t('superAdmin.nav.settings') },
        { href: '/super-admin/akun', icon: Users, label: t('superAdmin.nav.accounts') },
      ],
    },
  ];
}

function isActive(item: NavItem, pathname: string) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type ShellProps = {
  title: string;
  /** Label grup untuk breadcrumb, mis. "Konten situs". */
  group?: string;
  description?: string;
  /** Path halaman publik terkait; menampilkan tautan "Lihat di situs". */
  viewHref?: string;
  /** Lebar konten lebar (daftar kartu) — default kolom form yang nyaman dibaca. */
  wide?: boolean;
  children: React.ReactNode;
};

/**
 * Shell panel Super Admin: sidebar slate (desktop), laci menu (mobile), header
 * halaman dengan breadcrumb. Eksklusif SUPER_ADMIN (`roleHome.ts`).
 * Warna slate (bukan coklat Owner / hijau Admin) biar identitasnya beda.
 */
export function SuperAdminLayout(props: ShellProps) {
  return (
    <DirtyProvider>
      <Shell {...props} />
    </DirtyProvider>
  );
}

function Shell({ title, group, description, viewHref, wide, children }: ShellProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const groups = useSuperNav();
  const { anyDirty } = useDirtyState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { logout } = useAuth();
  const { user, isAllowed } = useRequireRole(['SUPER_ADMIN']);

  /** Pindah halaman lewat menu: minta konfirmasi bila ada editor yang belum disimpan. */
  function guardLeave(e: React.MouseEvent) {
    if (anyDirty && !window.confirm(t('superAdmin.cms.leaveConfirm'))) {
      e.preventDefault();
      return;
    }
    setDrawerOpen(false);
  }

  function handleLogout() {
    if (anyDirty && !window.confirm(t('superAdmin.cms.leaveConfirm'))) return;
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
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-[#0f172a] text-[#94a3b8] md:flex">
        <Brand />
        <NavList groups={groups} pathname={pathname} onNavigate={guardLeave} className="flex-1 overflow-y-auto" />
        <PasswordLink onNavigate={guardLeave} label={t('account.changePassword')} />
        <LogoutButton onClick={handleLogout} label={t('admin.logout')} />
      </aside>

      {/* Laci menu mobile */}
      {drawerOpen && (
        <MobileDrawer onClose={() => setDrawerOpen(false)}>
          <Brand />
          <NavList groups={groups} pathname={pathname} onNavigate={guardLeave} className="flex-1 overflow-y-auto" />
          <div className="border-t border-white/10 p-3">
            <div className="px-3.5 py-2">
              <div className="text-[13px] font-semibold text-white">{displayName}</div>
              <div className="text-[12px] text-[#94a3b8]">{roleLabel}</div>
            </div>
            <PasswordLink onNavigate={guardLeave} label={t('account.changePassword')} className="mx-0 mb-0" />
            <LogoutButton onClick={handleLogout} label={t('admin.logout')} />
          </div>
        </MobileDrawer>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[#e8e2d5] bg-[#fbf9f4] px-4 md:bg-white md:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label={t('superAdmin.cms.openMenu')}
            aria-expanded={drawerOpen}
            className="-ml-1 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#0f172a] hover:bg-sky-50 focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:outline-none md:hidden"
          >
            <Menu size={20} strokeWidth={1.75} aria-hidden />
          </button>
          <Link href="/super-admin" className="flex items-center gap-2 md:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0f172a] text-sky-400">
              <Mountain size={16} strokeWidth={1.5} aria-hidden />
            </span>
            <span className="font-serif text-[15px] leading-tight font-bold text-[#0f172a]">
              D&apos;Glorious <span className="text-sky-700">Crater</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3.5">
            <LanguageSwitcher />
            <div className="hidden items-center gap-2.5 md:flex">
              <div className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-[#0f172a] text-sm font-bold text-sky-400">
                {initials(displayName)}
              </div>
              <div>
                <div className="text-[13.5px] leading-tight font-semibold">{displayName}</div>
                <div className="mt-0.5 inline-block rounded-full bg-sky-50 px-2 py-0.5 text-[11px] text-sky-800">
                  {roleLabel}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-9">
          <div className={cn('mx-auto w-full', wide ? 'max-w-6xl' : 'max-w-4xl')}>
            <PageHeading
              title={title}
              group={group}
              description={description}
              viewHref={viewHref}
              onNavigate={guardLeave}
            />
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function Brand() {
  const { t } = useTranslation();
  return (
    <div className="border-b border-white/10 px-5.5 py-4">
      <div className="font-serif text-[19px] font-extrabold text-white">
        D&apos;Glorious <span className="text-sky-400">Crater</span>
      </div>
      <div className="mt-1 text-[11px] tracking-[0.12em] text-sky-300 uppercase">
        {t('superAdmin.portal')}
      </div>
    </div>
  );
}

function NavList({
  groups,
  pathname,
  onNavigate,
  className,
}: {
  groups: NavGroup[];
  pathname: string;
  onNavigate: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <nav
      className={cn(
        'flex flex-col gap-3 p-2.5 [scrollbar-color:#334155_transparent] [scrollbar-width:thin]',
        className,
      )}
    >
      {groups.map((g, gi) => (
        <div key={g.label ?? gi}>
          {g.label && (
            <div className="px-3.5 pb-1 text-[10.5px] font-semibold tracking-[0.1em] text-[#8b9ab2] uppercase">
              {g.label}
            </div>
          )}
          <ul className="flex flex-col gap-0.5">
            {g.items.map((item) => {
              const active = isActive(item, pathname);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-[10px] border-l-[3px] px-3.5 py-2 text-[13.5px] md:min-h-9 font-medium transition-colors',
                      'focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none',
                      active
                        ? 'border-sky-400 bg-sky-400/15 text-white'
                        : 'border-transparent text-[#a3b0c4] hover:bg-sky-400/10 hover:text-white',
                    )}
                  >
                    <Icon size={17} strokeWidth={1.75} className="shrink-0" aria-hidden />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function PasswordLink({
  onNavigate,
  label,
  className,
}: {
  onNavigate: (e: React.MouseEvent) => void;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href="/akun/kata-sandi"
      onClick={onNavigate}
      className={cn(
        'mx-2.5 mt-2.5 -mb-1.5 flex min-h-11 items-center gap-3 rounded-[10px] px-3.5 py-2 text-[13.5px] font-medium text-[#a3b0c4] transition-colors md:min-h-9',
        'hover:bg-sky-400/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none',
        className,
      )}
    >
      <KeyRound size={17} strokeWidth={1.75} className="shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

function LogoutButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="m-2.5 flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3.5 py-2 md:min-h-9 text-left text-[13.5px] font-medium text-[#a3b0c4] transition-colors hover:bg-sky-400/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
    >
      <LogOut size={17} strokeWidth={1.75} className="shrink-0" aria-hidden />
      {label}
    </button>
  );
}

function MobileDrawer({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const { t } = useTranslation();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t('superAdmin.cms.menu')}>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#0f172a]/55"
      />
      <div className="relative flex h-full w-[17.5rem] max-w-[85vw] flex-col bg-[#0f172a] text-[#94a3b8]">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t('superAdmin.cms.closeMenu')}
          className="absolute top-3 right-3 flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-[#a3b0c4] hover:bg-sky-400/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:outline-none"
        >
          <X size={18} strokeWidth={1.75} aria-hidden />
        </button>
        {children}
      </div>
    </div>
  );
}

function PageHeading({
  title,
  group,
  description,
  viewHref,
  onNavigate,
}: {
  title: string;
  group?: string;
  description?: string;
  viewHref?: string;
  onNavigate: (e: React.MouseEvent) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 max-w-2xl">
        {group && (
          <nav aria-label="Breadcrumb" className="text-muted mb-1.5 flex items-center gap-1 text-[12.5px]">
            <Link
              href="/super-admin"
              onClick={onNavigate}
              className="hover:text-forest-800 rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:outline-none"
            >
              {t('superAdmin.nav.overview')}
            </Link>
            <ChevronRight size={12} aria-hidden />
            <span>{group}</span>
            <ChevronRight size={12} aria-hidden />
            <span aria-current="page" className="text-muted-strong font-medium">
              {title}
            </span>
          </nav>
        )}
        <h1 className="text-forest-800 font-serif text-[26px] leading-tight font-bold md:text-[30px]">
          {title}
        </h1>
        {description && <p className="text-muted mt-1.5 text-[14px] leading-relaxed">{description}</p>}
      </div>
      {viewHref && (
        <a
          href={viewHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[13px] font-semibold text-sky-800 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:outline-none"
        >
          {t('superAdmin.cms.viewOnSite')}
          <ExternalLink size={14} strokeWidth={1.75} aria-hidden />
        </a>
      )}
    </div>
  );
}
