'use client';

import { useEffect, useState } from 'react';
import {
  MastSkeleton,
  PageMast,
  Skeleton,
  actionClass,
} from '@/components/public/ui';
import { fetchPublicSettings } from '@/lib/api/settings';
import { pickL } from '@/lib/api/siteContent';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useSiteContent } from '@/lib/useSiteContent';
import { usePublicSettings, waLink } from '@/lib/usePublicSettings';

type Status = 'loading' | 'ready' | 'error';

export function TermsPage() {
  const { t, locale } = useTranslation();
  // Hasil fetch dibawa bersama bahasanya; bahasa berganti = memuat ulang
  // (status diturunkan saat render, bukan di-set dari dalam effect).
  const [result, setResult] = useState<{
    locale: string;
    terms: string[];
    status: Status;
  } | null>(null);
  const current = result && result.locale === locale ? result : null;
  const terms = current?.terms ?? [];
  const status: Status = current?.status ?? 'loading';
  const { settings } = usePublicSettings();
  const { content, failed: contentFailed } = useSiteContent();
  const page = content?.sections.terms;

  useEffect(() => {
    let active = true;
    // Dipanggil terpisah dari `usePublicSettings` karena isinya bergantung
    // bahasa aktif: `Setting.value` bukan per-bahasa, jadi teks S&K disimpan
    // sebagai dua key berbeda dan harus dipilih ulang saat locale berganti.
    fetchPublicSettings()
      .then((s) => {
        if (!active) return;
        const raw =
          locale === 'en' ? s.terms_conditions_en : s.terms_conditions_id;
        setResult({
          locale,
          terms: (raw ?? '').split('\n').filter(Boolean),
          status: 'ready',
        });
      })
      .catch(() => {
        if (active) setResult({ locale, terms: [], status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [locale]);

  const waHref = waLink(
    settings?.whatsapp_number,
    content ? pickL(content.sections.contact.waMessages.terms, locale) : '',
  );

  return (
    <div className="pb-24">
      {page ? (
        <PageMast
          title={pickL(page.title, locale)}
          lead={pickL(page.subtitle, locale)}
        />
      ) : contentFailed ? (
        <PageMast title={t('footer.terms')} />
      ) : (
        <MastSkeleton />
      )}

      <div className="container-page max-w-[46rem] pt-12">
        {status === 'loading' && (
          <div className="flex flex-col gap-7">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-5">
                <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3.5 w-full" />
                  <Skeleton className="mt-2.5 h-3.5 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {status === 'error' && (
          <p className="text-ash-700 text-[15px]">{t('common.loadError')}</p>
        )}

        {status === 'ready' && (
          /* Nomornya dipertahankan karena dokumen ini memang bernomor dan
             klien merujuk poinnya lewat nomor itu ("S&K poin 7") — jadi
             angkanya membawa keterangan, bukan hiasan urutan. Pemisahnya
             garis rambut, bukan kartu: dua belas kotak bertumpuk cuma akan
             memecah teks yang seharusnya terbaca mengalir. */
          <ol className="divide-ash-300/70 border-ash-300/70 divide-y border-y">
            {terms.map((point, i) => (
              <li key={i} className="flex gap-5 py-6 first:pt-0 last:pb-0">
                <span
                  className="text-mineral-600 mt-0.5 shrink-0 font-serif text-lg tabular-nums"
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-ash-800 text-[15.5px] leading-[1.75]">
                  {/* Sumbernya sudah bernomor ("1. ..."); prefiksnya dibuang
                      supaya tidak dobel dengan angka di sebelah kiri. */}
                  {point.replace(/^\d+\.\s*/, '')}
                </p>
              </li>
            ))}
          </ol>
        )}

        {status === 'ready' && terms.length > 0 && page && (
          <div className="border-ash-300/70 mt-14 rounded-2xl border border-dashed px-6 py-7">
            <p className="text-ash-800 font-serif text-lg">
              {pickL(page.questionTitle, locale)}
            </p>
            <p className="text-ash-600 mt-1.5 max-w-[58ch] text-sm leading-relaxed">
              {pickL(page.questionBody, locale)}
            </p>
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass('primary', 'md', 'mt-5')}
              >
                {t('nav.reserve')}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
