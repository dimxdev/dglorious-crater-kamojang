'use client';

import { Check } from 'lucide-react';
import Image from 'next/image';
import { PageMast } from '@/components/public/ui';
import {
  getAttractions,
  getGalleryItems,
  getParkingFees,
  getTicketPackages,
} from '@/lib/data/content';
import { KawasanIndex } from './KawasanIndex';
import { getImage } from '@/lib/data/images';
import { formatIDR } from '@/lib/format';
import { getIcon } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function AboutPage() {
  const { t, locale } = useTranslation();
  const historyPhoto = getImage('attractionKopi');
  const attractions = getAttractions(locale);
  const galleryItems = getGalleryItems(locale);
  const ticketPackages = getTicketPackages(locale);
  const parkingFees = getParkingFees(locale);

  return (
    <div className="pb-24">
      <PageMast
        title={t('about.title')}
        lead={t('about.historyLead')}
        meta={[
          { label: t('about.statFoundedLabel'), value: t('about.statFoundedValue') },
          { label: t('about.statElevationLabel'), value: t('about.statElevationValue') },
          { label: t('about.statAreaLabel'), value: t('about.statAreaValue') },
        ]}
      />

      {/* SEJARAH */}
      <section className="container-page pt-16">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div className="max-w-[62ch]">
            {[
              t('about.historyBody'),
              t('about.historyBody2'),
              t('about.historyBody3'),
              t('about.historyBody4'),
            ].map((para, i) => (
              <p
                key={i}
                className="text-ash-700 mt-6 max-w-[62ch] text-[1.02rem] leading-[1.8] first:mt-0"
              >
                {para}
              </p>
            ))}
          </div>

          <div className="relative h-72 overflow-hidden rounded-2xl lg:h-full lg:min-h-100">
            <Image
              src={historyPhoto.src}
              alt={historyPhoto.alt}
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
              style={{ objectPosition: historyPhoto.objectPosition }}
            />
          </div>
        </div>
      </section>

      {/* DAYA TARIK */}
      <section id="atraksi" className="container-page scroll-mt-24 pt-24">
        <SectionHeading>{t('about.attractionsTitle')}</SectionHeading>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {attractions.map((a) => {
            const Icon = getIcon(a.icon);
            const photo = getImage(a.photo);
            return (
              <article key={a.name} className="group">
                <div className="relative h-52 overflow-hidden rounded-2xl">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                    style={{ objectPosition: photo.objectPosition }}
                  />
                </div>
                <div className="mt-4 flex items-start gap-2.5">
                  <Icon
                    size={16}
                    strokeWidth={1.5}
                    className="text-mineral-600 mt-1.5 shrink-0"
                    aria-hidden
                  />
                  <div>
                    <h3 className="text-ash-900 font-serif text-lg leading-snug">
                      {a.name}
                    </h3>
                    <p className="text-ash-600 mt-1.5 text-[13.5px] leading-relaxed">
                      {a.desc}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* GALERI */}
      <section className="container-page pt-24">
        <SectionHeading>{t('about.galleryTitle')}</SectionHeading>
        <div className="mt-10 grid auto-rows-47.5 grid-cols-2 gap-4 sm:grid-cols-4">
          {galleryItems.map((item, i) => {
            const photo = getImage(item.photo);
            return (
              <figure
                key={item.photo}
                className={`bg-moss-900 group relative overflow-hidden rounded-2xl ${
                  i === 0 ? 'col-span-2 row-span-2' : ''
                } ${i === 3 ? 'sm:col-span-2' : ''}`}
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes={
                    i === 0
                      ? '(min-width: 640px) 50vw, 100vw'
                      : '(min-width: 640px) 25vw, 50vw'
                  }
                  className="object-cover"
                  style={{ objectPosition: photo.objectPosition }}
                />
                <div className="from-moss-900/75 absolute inset-x-0 bottom-0 h-20 bg-linear-to-t to-transparent" />
                <figcaption className="text-ash-50 absolute bottom-3 left-4 text-[12.5px] font-medium">
                  {item.label}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      {/* FASILITAS KAWASAN — 20 fasilitas asli yang tercetak di spanduk resmi
          di lokasi. Anchor #fasilitas dipakai halaman detail unit sebagai
          tautan ke sini. */}
      <KawasanIndex />

      {/* TIKET & PARKIR */}
      <section id="tiket" className="container-page scroll-mt-24 pt-24">
        <SectionHeading>{t('about.ticketTitle')}</SectionHeading>

        {/* Di sini kartu memang tepat: empat paket yang dibandingkan
            berdampingan, tepinya menandai batas "satu paket berhenti di sini". */}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ticketPackages.map((p) => (
            <article
              key={p.key}
              className="border-ash-300/70 flex flex-col rounded-2xl border bg-white p-6"
            >
              <h3 className="text-ash-900 font-serif text-lg">{p.name}</h3>
              {p.note && (
                <span className="bg-sulfur-50 text-sulfur-700 mt-2 w-fit rounded-full px-2.5 py-1 text-[12.5px] font-semibold">
                  {p.note}
                </span>
              )}
              <ul className="mt-4 flex-1 space-y-2">
                {p.benefits.map((b) => (
                  <li
                    key={b}
                    className="text-ash-700 flex gap-2 text-[13px] leading-snug"
                  >
                    <Check
                      size={14}
                      strokeWidth={2}
                      className="text-moss-600 mt-0.5 shrink-0"
                      aria-hidden
                    />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <dl className="border-ash-200 mt-5 grid grid-cols-2 gap-3 border-t pt-4">
                <div>
                  <dt className="text-ash-600 text-[11.5px]">
                    {t('about.ticketDaytime')}
                  </dt>
                  <dd className="text-ash-900 mt-1 font-serif text-base">
                    {formatIDR(p.priceDay)}
                  </dd>
                </div>
                <div>
                  <dt className="text-ash-600 text-[11.5px]">
                    {t('about.ticketNighttime')}
                  </dt>
                  <dd className="text-ash-900 mt-1 font-serif text-base">
                    {formatIDR(p.priceNight)}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>

        <p className="text-ash-600 mx-auto mt-6 max-w-[62ch] text-center text-[12.5px] leading-relaxed">
          {t('about.ticketNote')}
        </p>

        <div className="mx-auto mt-14 max-w-2xl">
          <h3 className="text-ash-900 text-center font-serif text-xl">
            {t('about.parkingTitle')}
          </h3>
          <dl className="divide-ash-200 border-ash-200 mt-6 grid grid-cols-2 divide-x divide-y border sm:grid-cols-4 sm:divide-y-0">
            {parkingFees.map((f) => (
              <div key={f.vehicle} className="px-4 py-5 text-center">
                <dt className="text-ash-600 text-sm font-medium">{f.vehicle}</dt>
                <dd className="text-ash-900 mt-1.5 font-serif text-base">
                  {formatIDR(f.price)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </div>
  );
}

/**
 * Judul seksi. Rata kiri, bukan tengah — halaman ini dibaca dari kiri, dan
 * judul tengah di atas isi rata kiri bikin mata melompat bolak-balik di tiap
 * pergantian bab.
 */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-ash-900 max-w-[20ch] font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
      {children}
    </h2>
  );
}
