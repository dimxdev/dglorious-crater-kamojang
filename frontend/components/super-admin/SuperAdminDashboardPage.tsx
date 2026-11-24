'use client';

import { ChevronRight, FileText, Home, Images, Info, Phone, Settings, Tent, Ticket, Trees, Users, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { SuperAdminLayout } from './SuperAdminLayout';

type Row = { href: string; icon: LucideIcon; key: string };

const CONTENT_ROWS: Row[] = [
  { href: '/super-admin/konten/beranda', icon: Home, key: 'home' },
  { href: '/super-admin/konten/tentang', icon: Info, key: 'about' },
  { href: '/super-admin/konten/atraksi', icon: Trees, key: 'attractions' },
  { href: '/super-admin/konten/tiket', icon: Ticket, key: 'tickets' },
  { href: '/super-admin/konten/galeri', icon: Images, key: 'gallery' },
  { href: '/super-admin/konten/kontak', icon: Phone, key: 'contact' },
  { href: '/super-admin/konten/halaman', icon: FileText, key: 'pages' },
];

const focusRing = 'focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 focus-visible:outline-none';

/**
 * Hub navigasi Super Admin, bukan dashboard analitik (itu peran Owner, dan
 * Owner-nya eksklusif, lihat `OwnerLayout.tsx`). Susunannya mengikuti pekerjaan
 * yang sering dilakukan: konten situs paling sering diubah (daftar panjang),
 * sisanya tujuan tunggal (kolom samping).
 */
export function SuperAdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <SuperAdminLayout
      wide
      title={t('superAdmin.greeting', { name: user?.name ?? '' })}
      description={t('superAdmin.hub.subtitle')}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[#ece6d8] bg-white p-5 md:p-6">
          <h2 className="text-forest-800 font-serif text-[19px] font-bold">{t('superAdmin.nav.groupContent')}</h2>
          <p className="text-muted mt-1 text-[13px] leading-relaxed">{t('superAdmin.hub.contentDesc')}</p>
          <ul className="mt-4 divide-y divide-[#f1ecdf]">
            {CONTENT_ROWS.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className={`group -mx-2 flex min-h-14 items-center gap-3.5 rounded-xl px-2 py-3 transition-colors hover:bg-sky-50/70 ${focusRing}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                    <r.icon size={17} strokeWidth={1.75} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-foreground block text-[14px] font-semibold">{t(`superAdmin.nav.${r.key}`)}</span>
                    <span className="text-muted block text-[12.5px] leading-snug">{t(`superAdmin.hub.${r.key}`)}</span>
                  </span>
                  <ChevronRight size={16} strokeWidth={1.75} className="text-muted shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-col gap-6">
          <Link
            href="/super-admin/penginapan"
            className={`group rounded-2xl border border-[#ece6d8] bg-white p-5 transition-shadow hover:shadow-md ${focusRing}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-800">
              <Tent size={19} strokeWidth={1.75} aria-hidden />
            </span>
            <h2 className="text-forest-800 mt-3.5 font-serif text-[17px] font-bold">{t('superAdmin.nav.rooms')}</h2>
            <p className="text-muted mt-1 text-[13px] leading-snug">{t('superAdmin.hub.rooms')}</p>
          </Link>

          <Link
            href="/super-admin/pengaturan"
            className={`group rounded-2xl border border-[#ece6d8] bg-white p-5 transition-shadow hover:shadow-md ${focusRing}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Settings size={19} strokeWidth={1.75} aria-hidden />
            </span>
            <h2 className="text-forest-800 mt-3.5 font-serif text-[17px] font-bold">{t('superAdmin.nav.settings')}</h2>
            <p className="text-muted mt-1 text-[13px] leading-snug">{t('superAdmin.hub.settings')}</p>
          </Link>

          <Link
            href="/super-admin/akun"
            className={`group rounded-2xl border border-[#ece6d8] bg-white p-5 transition-shadow hover:shadow-md ${focusRing}`}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Users size={19} strokeWidth={1.75} aria-hidden />
            </span>
            <h2 className="text-forest-800 mt-3.5 font-serif text-[17px] font-bold">{t('superAdmin.nav.accounts')}</h2>
            <p className="text-muted mt-1 text-[13px] leading-snug">{t('superAdmin.hub.accounts')}</p>
          </Link>
        </div>
      </div>
    </SuperAdminLayout>
  );
}
