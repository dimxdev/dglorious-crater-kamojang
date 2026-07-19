'use client';

import { ImagePlaceholder } from '@/components/ui';
import { galleryFacilities, gallerySlots } from '@/lib/data/content';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* HERO */}
      <section className="relative flex min-h-[340px] items-end overflow-hidden">
        <ImagePlaceholder
          icon="🏔️"
          label="Foto lanskap Kamojang"
          className="absolute inset-0"
        />
        <div className="from-forest-900/80 absolute inset-0 bg-linear-to-b to-transparent" />
        <div className="container-page relative w-full pb-12">
          <div className="text-terracotta-200 text-[0.78rem] font-semibold tracking-[0.22em] uppercase">
            {t('about.eyebrow')}
          </div>
          <h1 className="mt-2.5 font-serif text-3xl leading-[1.05] font-extrabold text-cream-100 sm:text-5xl">
            {t('about.title')}
          </h1>
        </div>
      </section>

      {/* SEJARAH */}
      <section className="mx-auto max-w-[900px] px-7 pt-20 text-center">
        <div className="eyebrow">{t('about.historyEyebrow')}</div>
        <p className="mt-4 font-serif text-2xl leading-snug font-medium sm:text-3xl">
          {t('about.historyLead')}
        </p>
        <p className="text-muted-strong mt-6 text-left text-base leading-8">
          {t('about.historyBody')}
        </p>
      </section>

      {/* GALERI (bento) */}
      <section className="container-page pt-18">
        <h2 className="text-center font-serif text-2xl font-bold sm:text-4xl">
          {t('about.galleryTitle')}
        </h2>
        <div className="mt-8 grid auto-rows-[180px] grid-cols-2 gap-3.5 sm:grid-cols-4">
          {gallerySlots.map((label, i) => (
            <div
              key={label}
              className={`relative overflow-hidden rounded-2xl ${
                i === 0 ? 'col-span-2 row-span-2' : ''
              } ${i === 3 ? 'sm:col-span-2' : ''}`}
            >
              <ImagePlaceholder icon="📷" label={label} />
            </div>
          ))}
        </div>
      </section>

      {/* FASILITAS */}
      <section className="bg-surface-alt mt-20 py-20">
        <div className="container-page">
          <h2 className="text-center font-serif text-2xl font-bold sm:text-4xl">
            {t('about.facilitiesTitle')}
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {galleryFacilities.map((f) => (
              <div
                key={f.label}
                className="rounded-2xl border border-[#eee5d5] bg-white p-5.5 text-center"
              >
                <div className="text-3xl">{f.icon}</div>
                <div className="text-muted-strong mt-2.5 text-[13px] font-medium">
                  {f.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
