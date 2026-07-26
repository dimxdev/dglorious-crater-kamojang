'use client';

import { getSettings } from '@/lib/data/settings';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function TermsPage() {
  const { t, locale } = useTranslation();
  const { termsAndConditions } = getSettings(locale);

  return (
    <div className="container-page max-w-190 pt-14 pb-24">
      <div className="eyebrow">{t('terms.eyebrow')}</div>
      <h1 className="mt-2.5 font-serif text-3xl font-extrabold sm:text-4xl">{t('terms.title')}</h1>
      <p className="text-muted mt-3 text-sm">{t('terms.subtitle')}</p>

      <ol className="mt-8 flex flex-col gap-4">
        {termsAndConditions.map((point, i) => (
          <li key={i} className="flex gap-3.5">
            <span className="bg-forest-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
              {i + 1}
            </span>
            <p className="pt-0.5 text-[15px] leading-relaxed">{point}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
