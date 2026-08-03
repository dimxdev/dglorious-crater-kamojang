'use client';

import { useEffect, useState } from 'react';
import { fetchPublicSettings } from '@/lib/api/settings';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function TermsPage() {
  const { t, locale } = useTranslation();
  const [terms, setTerms] = useState<string[] | null>(null);

  useEffect(() => {
    fetchPublicSettings()
      .then((settings) => {
        // Setting.value cuma satu string per key (bukan per-bahasa) — teks
        // bilingual disimpan sebagai 2 key terpisah (§ FASE 6 plan).
        const raw = locale === 'en' ? settings.terms_conditions_en : settings.terms_conditions_id;
        setTerms((raw ?? '').split('\n').filter(Boolean));
      })
      .catch(() => setTerms([]));
  }, [locale]);

  return (
    <div className="container-page max-w-190 pt-14 pb-24">
      <div className="eyebrow">{t('terms.eyebrow')}</div>
      <h1 className="mt-2.5 font-serif text-3xl font-extrabold sm:text-4xl">{t('terms.title')}</h1>
      <p className="text-muted mt-3 text-sm">{t('terms.subtitle')}</p>

      {terms === null ? (
        <p className="text-muted mt-8 text-sm">{t('common.loading')}</p>
      ) : (
        <ol className="mt-8 flex flex-col gap-4">
          {terms.map((point, i) => (
            <li key={i} className="flex gap-3.5">
              <span className="bg-forest-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                {i + 1}
              </span>
              {/* Poin sudah bernomor dari sumbernya ("1. ...") — buang prefix biar gak dobel sama badge angka. */}
              <p className="pt-0.5 text-[15px] leading-relaxed">
                {point.replace(/^\d+\.\s*/, '')}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
