'use client';

import Image from 'next/image';
import {
  getAttractions,
  getFacilities,
  getGalleryItems,
  getParkingFees,
  getTicketPackages,
} from '@/lib/data/content';
import { getImage } from '@/lib/data/images';
import { formatIDR } from '@/lib/format';
import { getIcon } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useReveal } from '@/lib/useReveal';

export function AboutPage() {
  const { t, locale } = useTranslation();
  const historyPhoto = getImage('attractionKopi');
  const attractions = getAttractions(locale);
  const galleryFacilities = getFacilities(locale);
  const galleryItems = getGalleryItems(locale);
  const ticketPackages = getTicketPackages(locale);
  const parkingFees = getParkingFees(locale);

  const stats = [
    { label: t('about.statFoundedLabel'), value: t('about.statFoundedValue') },
    { label: t('about.statElevationLabel'), value: t('about.statElevationValue') },
    { label: t('about.statAreaLabel'), value: t('about.statAreaValue') },
  ];

  const historyRef = useReveal<HTMLElement>();
  const attractionsRef = useReveal<HTMLElement>();
  const galleryRef = useReveal<HTMLElement>();
  const facilitiesRef = useReveal<HTMLElement>();
  const ticketRef = useReveal<HTMLElement>();

  return (
    <div>
      {/* HERO — judul simpel, konsisten dengan header halaman Penginapan */}
      <div className="container-page pt-14">
        <div className="eyebrow">{t('about.eyebrow')}</div>
        <h1 className="mt-2.5 font-serif text-3xl font-extrabold sm:text-4xl">
          {t('about.title')}
        </h1>
      </div>

      {/* SEJARAH — tanpa label section terpisah: section ini menyambung langsung
          dari hero (judul halaman + kalimat pembuka sudah cukup jadi penanda),
          beda dgn Galeri/Fasilitas yg jadi "bab baru" setelah jeda konten */}
      <section ref={historyRef} data-reveal className="container-page pt-8">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="font-serif text-xl leading-snug font-normal sm:text-2xl">
              {t('about.historyLead')}
            </p>
            <p className="text-muted-strong mt-6 text-base leading-8">
              {t('about.historyBody')}
            </p>
            <p className="text-muted-strong mt-5 text-base leading-8">
              {t('about.historyBody2')}
            </p>
            <p className="text-muted-strong mt-5 text-base leading-8">
              {t('about.historyBody3')}
            </p>
            <p className="text-muted-strong mt-5 text-base leading-8">
              {t('about.historyBody4')}
            </p>

            <div className="border-border mt-9 grid grid-cols-3 gap-4 border-t pt-7">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-forest-700 font-serif text-xl font-bold sm:text-2xl">
                    {s.value}
                  </div>
                  <div className="text-muted mt-1 text-xs">{s.label}</div>
                </div>
              ))}
            </div>
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

      {/* DAYA TARIK WISATA — semua spot (bukan cuma 4 teaser di homepage) */}
      <section
        ref={attractionsRef}
        id="atraksi"
        data-reveal
        className="container-page scroll-mt-20 pt-24"
      >
        <h2 className="text-center font-serif text-3xl font-normal sm:text-[2.6rem]">
          {t('about.attractionsTitle')}
        </h2>
        <div className="mt-11 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {attractions.map((a) => {
            const Icon = getIcon(a.icon);
            const photo = getImage(a.photo);
            return (
              <article
                key={a.name}
                className="group border-border overflow-hidden rounded-2xl border bg-white transition-colors duration-300 hover:border-stone-400"
              >
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                    style={{ objectPosition: photo.objectPosition }}
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start gap-2">
                    <Icon
                      size={16}
                      strokeWidth={1.5}
                      className="text-accent mt-1 shrink-0"
                      aria-hidden
                    />
                    <h3 className="font-serif text-lg leading-tight font-medium">
                      {a.name}
                    </h3>
                  </div>
                  <p className="text-muted mt-2 text-[13.5px] leading-relaxed">
                    {a.desc}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* GALERI — bento foto asli, label di scrim kaki foto */}
      <section ref={galleryRef} data-reveal className="container-page pt-24">
        <h2 className="text-center font-serif text-3xl font-normal sm:text-[2.6rem]">
          {t('about.galleryTitle')}
        </h2>
        <div className="mt-10 grid auto-rows-47.5 grid-cols-2 gap-4 sm:grid-cols-4">
          {galleryItems.map((item, i) => {
            const photo = getImage(item.photo);
            return (
              <figure
                key={item.photo}
                className={`group relative overflow-hidden rounded-2xl ${
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
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                  style={{ objectPosition: photo.objectPosition }}
                />
                <div className="from-green-900/70 absolute inset-x-0 bottom-0 h-16 bg-linear-to-t to-transparent" />
                <figcaption className="absolute bottom-2.5 left-3.5 text-[12.5px] font-medium text-stone-50/95">
                  {item.label}
                </figcaption>
              </figure>
            );
          })}
        </div>
      </section>

      {/* FASILITAS */}
      <section ref={facilitiesRef} data-reveal className="bg-surface-alt mt-24 py-24">
        <div className="container-page">
          <h2 className="text-center font-serif text-3xl font-normal sm:text-[2.6rem]">
            {t('about.facilitiesTitle')}
          </h2>
          <div className="mt-11 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {galleryFacilities.map((f) => {
              const Icon = getIcon(f.icon);
              return (
                <div
                  key={f.label}
                  className="border-border flex flex-col items-center rounded-2xl border bg-white p-5.5 text-center transition-colors duration-300 hover:border-stone-400"
                >
                  <Icon
                    size={22}
                    strokeWidth={1.5}
                    className="text-accent"
                    aria-hidden
                  />
                  <div className="text-muted-strong mt-3 text-[13px] leading-snug font-medium">
                    {f.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HARGA TIKET & PARKIR — dari price list resmi klien */}
      <section
        ref={ticketRef}
        id="tiket"
        data-reveal
        className="container-page scroll-mt-20 mt-24 pb-24"
      >
        <h2 className="text-center font-serif text-3xl font-normal sm:text-[2.6rem]">
          {t('about.ticketTitle')}
        </h2>

        <div className="mt-11 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ticketPackages.map((p) => (
            <div
              key={p.key}
              className="border-border flex flex-col rounded-2xl border bg-white p-5.5"
            >
              <h3 className="font-serif text-lg font-semibold">{p.name}</h3>
              {p.note && (
                <span className="bg-chip text-muted-strong mt-1.5 inline-block w-fit rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  {p.note}
                </span>
              )}
              <ul className="text-muted-strong mt-3.5 flex-1 space-y-1.5 text-[13px] leading-snug">
                {p.benefits.map((b) => (
                  <li key={b} className="flex gap-1.5">
                    <span className="text-accent" aria-hidden>
                      ✓
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="border-border mt-4.5 grid grid-cols-2 gap-3 border-t pt-4">
                <div>
                  <div className="text-muted text-[11px]">
                    {t('about.ticketDaytime')}
                  </div>
                  <div className="text-forest-700 font-serif text-base font-bold">
                    {formatIDR(p.priceDay)}
                  </div>
                </div>
                <div>
                  <div className="text-muted text-[11px]">
                    {t('about.ticketNighttime')}
                  </div>
                  <div className="text-forest-700 font-serif text-base font-bold">
                    {formatIDR(p.priceNight)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-muted mt-5 text-center text-[12.5px]">
          {t('about.ticketNote')}
        </p>

        {/* Parkir */}
        <div className="mx-auto mt-12 max-w-2xl">
          <h3 className="text-center font-serif text-xl font-semibold">
            {t('about.parkingTitle')}
          </h3>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {parkingFees.map((f) => (
              <div
                key={f.vehicle}
                className="border-border rounded-xl border bg-white p-4 text-center"
              >
                <div className="text-muted-strong text-sm font-medium">
                  {f.vehicle}
                </div>
                <div className="text-forest-700 mt-1 font-serif text-base font-bold">
                  {formatIDR(f.price)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
