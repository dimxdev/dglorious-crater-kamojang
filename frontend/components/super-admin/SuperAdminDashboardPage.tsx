'use client';

import { ArrowRight, BedDouble } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { SuperAdminLayout } from './SuperAdminLayout';

type SectionCard = {
  href: string;
  icon: typeof BedDouble;
  title: string;
  desc: string;
  tint: string;
  iconColor: string;
};

/**
 * Hub navigasi Super Admin — bukan dashboard analitik (itu peran Owner, dan
 * Owner-nya eksklusif, lihat `OwnerLayout.tsx`). Isinya cuma kartu-kartu
 * besar yang mengarahkan ke dashboard admin (§5 PROJECT.md, revisi
 * 2026-08-21: SUPER_ADMIN akses dashboard ADMIN, tapi TIDAK ke dashboard
 * Owner).
 */
export function SuperAdminDashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const sections: SectionCard[] = [
    {
      href: '/admin/penginapan',
      icon: BedDouble,
      title: t('superAdmin.cardPenginapanTitle'),
      desc: t('superAdmin.cardPenginapanDesc'),
      tint: 'bg-green-50',
      iconColor: 'text-green-700',
    },
  ];

  return (
    <SuperAdminLayout title={t('superAdmin.navHub')}>
      <div className="mb-7">
        <h1 className="text-forest-800 font-serif text-2xl font-extrabold md:text-[28px]">
          {t('superAdmin.greeting', { name: user?.name ?? '' })}
        </h1>
        <p className="text-muted mt-1.5 text-[14px]">{t('superAdmin.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const CardInner = (
            <>
              <div className="flex items-start justify-between">
                <span className={cn('flex h-11 w-11 items-center justify-center rounded-xl', s.tint)}>
                  <s.icon size={20} strokeWidth={1.75} className={s.iconColor} aria-hidden />
                </span>
                <ArrowRight
                  size={18}
                  strokeWidth={2}
                  className="text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </div>
              <div className="text-forest-800 mt-4 font-serif text-[17px] font-bold">{s.title}</div>
              <p className="text-muted mt-1.5 text-[13px] leading-snug">{s.desc}</p>
              <div className="text-forest-700 mt-4 text-[12.5px] font-semibold">
                {t('superAdmin.openDashboard')} →
              </div>
            </>
          );

          return (
            <Link
              key={s.title}
              href={s.href}
              className="group rounded-2xl border border-[#ece6d8] bg-white p-5.5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              {CardInner}
            </Link>
          );
        })}
      </div>
    </SuperAdminLayout>
  );
}
