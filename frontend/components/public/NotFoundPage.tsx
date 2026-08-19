'use client';

import Link from 'next/link';
import { PageMast, actionClass } from '@/components/public/ui';
import { useTranslation } from '@/lib/i18n/I18nProvider';

/**
 * Halaman 404. Sebelumnya memakai tampilan bawaan Next — layar putih dengan
 * teks "404 | This page could not be found", tanpa navbar, tanpa jalan
 * kembali, dan dalam bahasa Inggris di situs berbahasa Indonesia.
 *
 * Halaman salah alamat adalah titik keluar; tugasnya bukan minta maaf,
 * melainkan menawarkan langkah berikutnya yang jelas.
 */
export function NotFoundPage() {
  const { t } = useTranslation();

  const routes = [
    { href: '/penginapan', label: t('notFound.linkLodging') },
    { href: '/tentang', label: t('notFound.linkAbout') },
    { href: '/syarat-ketentuan', label: t('footer.terms') },
  ];

  return (
    <div className="pb-24">
      <PageMast
        title={t('notFound.title')}
        lead={t('notFound.lead')}
      />
      <div className="container-page pt-12">
        <Link href="/" className={actionClass('primary', 'lg')}>
          {t('notFound.home')}
        </Link>

        <nav aria-label={t('footer.explore')} className="mt-12 max-w-lg">
          <p className="text-ash-600 text-[11.5px] tracking-[0.14em] uppercase">
            {t('notFound.orTry')}
          </p>
          <ul className="divide-ash-300/70 border-ash-300/70 mt-3 divide-y border-t border-b">
            {routes.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="text-ash-800 hover:text-mineral-700 focus-visible:ring-mineral-500 flex min-h-14 items-center justify-between gap-4 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {r.label}
                  <span aria-hidden className="text-ash-500">
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
