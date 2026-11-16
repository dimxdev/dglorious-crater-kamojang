'use client';

import { Check } from 'lucide-react';
import Image from 'next/image';
import {
  HeadingSkeleton,
  MastSkeleton,
  PageMast,
  Skeleton,
} from '@/components/public/ui';
import { pickL, resolveContentImage } from '@/lib/api/siteContent';
import { formatIDR } from '@/lib/format';
import { resolveIcon } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useSiteContent } from '@/lib/useSiteContent';
import { KawasanIndex } from './KawasanIndex';

export function AboutPage() {
  const { t, locale } = useTranslation();
  const { content, failed } = useSiteContent();

  if (failed) {
    return (
      <div className="pb-24">
        <PageMast title={t('nav.about')} />
        <p className="container-page text-ash-700 text-[15px]">
          {t('common.loadError')}
        </p>
      </div>
    );
  }

  if (!content) return <AboutSkeleton />;

  const { sections: s, collections: c } = content;
  const historyImage = s.about_history.imageUrl
    ? resolveContentImage(s.about_history.imageUrl)
    : null;
  // Paragraf dipisah baris kosong di editor CMS.
  const historyParagraphs = pickL(s.about_history.body, locale)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const stats = s.about_intro.stats.map((st) => ({
    label: pickL(st.label, locale),
    value: pickL(st.value, locale),
  }));
  const galleryItems = c.GALLERY.filter((g) => g.imageUrl);

  return (
    <div className="pb-24">
      <PageMast
        title={pickL(s.about_intro.title, locale)}
        lead={pickL(s.about_intro.lead, locale)}
        meta={stats}
      />

      {/* SEJARAH */}
      <section className="container-page pt-16">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div className="max-w-[62ch]">
            {historyParagraphs.map((para, i) => (
              <p
                key={i}
                className="text-ash-700 mt-6 max-w-[62ch] text-[1.02rem] leading-[1.8] first:mt-0"
              >
                {para}
              </p>
            ))}
          </div>

          <div className="bg-ash-200 relative h-72 overflow-hidden rounded-2xl lg:h-full lg:min-h-100">
            {historyImage && (
              <Image
                src={historyImage}
                alt=""
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
            )}
          </div>
        </div>
      </section>

      {/* DAYA TARIK */}
      {c.ATTRACTION.length > 0 && (
        <section id="atraksi" className="container-page scroll-mt-24 pt-24">
          <SectionHeading>
            {pickL(s.about_attractions.title, locale)}
          </SectionHeading>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {c.ATTRACTION.map((a) => {
              const Icon = resolveIcon(a.content.icon);
              return (
                <article key={a.id} className="group">
                  <div className="bg-ash-200 relative h-52 overflow-hidden rounded-2xl">
                    {a.imageUrl && (
                      <Image
                        src={resolveContentImage(a.imageUrl)}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    )}
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
                        {pickL(a.content.name, locale)}
                      </h3>
                      <p className="text-ash-600 mt-1.5 text-[13.5px] leading-relaxed">
                        {pickL(a.content.desc, locale)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* GALERI */}
      {galleryItems.length > 0 && (
        <section className="container-page pt-24">
          <SectionHeading>
            {pickL(s.about_gallery.title, locale)}
          </SectionHeading>
          <div className="mt-10 grid auto-rows-47.5 grid-cols-2 gap-4 sm:grid-cols-4">
            {galleryItems.map((item, i) => {
              const label = pickL(item.content.label, locale);
              return (
                <figure
                  key={item.id}
                  className={`bg-moss-900 group relative overflow-hidden rounded-2xl ${
                    i === 0 ? 'col-span-2 row-span-2' : ''
                  } ${i === 3 ? 'sm:col-span-2' : ''}`}
                >
                  <Image
                    src={resolveContentImage(item.imageUrl as string)}
                    alt={label}
                    fill
                    sizes={
                      i === 0
                        ? '(min-width: 640px) 50vw, 100vw'
                        : '(min-width: 640px) 25vw, 50vw'
                    }
                    className="object-cover"
                  />
                  <div className="from-moss-900/75 absolute inset-x-0 bottom-0 h-20 bg-linear-to-t to-transparent" />
                  <figcaption className="text-ash-50 absolute bottom-3 left-4 text-[12.5px] font-medium">
                    {label}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* FASILITAS KAWASAN — dikelola di CMS (zona + butir fasilitas). Anchor
          #fasilitas dipakai halaman detail unit sebagai tautan ke sini. */}
      <KawasanIndex />

      {/* TIKET & PARKIR */}
      {(c.TICKET_PACKAGE.length > 0 || c.PARKING_FEE.length > 0) && (
        <section id="tiket" className="container-page scroll-mt-24 pt-24">
          {c.TICKET_PACKAGE.length > 0 && (
            <>
              <SectionHeading>
                {pickL(s.about_tickets.title, locale)}
              </SectionHeading>

              {/* Di sini kartu memang tepat: paket yang dibandingkan
                  berdampingan, tepinya menandai batas "satu paket berhenti di
                  sini". */}
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {c.TICKET_PACKAGE.map((p) => (
                  <article
                    key={p.id}
                    className="border-ash-300/70 flex flex-col rounded-2xl border bg-white p-6"
                  >
                    <h3 className="text-ash-900 font-serif text-lg">
                      {pickL(p.content.name, locale)}
                    </h3>
                    {p.content.note && pickL(p.content.note, locale) && (
                      <span className="bg-sulfur-50 text-sulfur-700 mt-2 w-fit rounded-full px-2.5 py-1 text-[12.5px] font-semibold">
                        {pickL(p.content.note, locale)}
                      </span>
                    )}
                    <ul className="mt-4 flex-1 space-y-2">
                      {p.content.benefits.map((b, i) => (
                        <li
                          key={i}
                          className="text-ash-700 flex gap-2 text-[13px] leading-snug"
                        >
                          <Check
                            size={14}
                            strokeWidth={2}
                            className="text-moss-600 mt-0.5 shrink-0"
                            aria-hidden
                          />
                          <span>{pickL(b, locale)}</span>
                        </li>
                      ))}
                    </ul>
                    <dl className="border-ash-200 mt-5 grid grid-cols-2 gap-3 border-t pt-4">
                      <div>
                        <dt className="text-ash-600 text-[11.5px]">
                          {t('about.ticketDaytime')}
                        </dt>
                        <dd className="text-ash-900 mt-1 font-serif text-base">
                          {formatIDR(p.content.priceDay)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-ash-600 text-[11.5px]">
                          {t('about.ticketNighttime')}
                        </dt>
                        <dd className="text-ash-900 mt-1 font-serif text-base">
                          {formatIDR(p.content.priceNight)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>

              <p className="text-ash-600 mx-auto mt-6 max-w-[62ch] text-center text-[12.5px] leading-relaxed">
                {pickL(s.about_tickets.note, locale)}
              </p>
            </>
          )}

          {c.PARKING_FEE.length > 0 && (
            <div className="mx-auto mt-14 max-w-2xl first:mt-0">
              <h3 className="text-ash-900 text-center font-serif text-xl">
                {pickL(s.about_parking.title, locale)}
              </h3>
              <dl className="divide-ash-200 border-ash-200 mt-6 grid grid-cols-2 divide-x divide-y border sm:grid-cols-4 sm:divide-y-0">
                {c.PARKING_FEE.map((f) => (
                  <div key={f.id} className="px-4 py-5 text-center">
                    <dt className="text-ash-600 text-sm font-medium">
                      {pickL(f.content.vehicle, locale)}
                    </dt>
                    <dd className="text-ash-900 mt-1.5 font-serif text-base">
                      {formatIDR(f.content.price)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </section>
      )}
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

/** Kerangka halaman Tentang selagi konten CMS dimuat. */
function AboutSkeleton() {
  return (
    <div className="pb-24" aria-hidden>
      <MastSkeleton />
      <section className="container-page pt-16">
        <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr]">
          <div className="max-w-[62ch]">
            {[0, 1, 2].map((i) => (
              <div key={i} className="mt-6 first:mt-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="mt-2.5 h-4 w-full" />
                <Skeleton className="mt-2.5 h-4 w-3/4" />
              </div>
            ))}
          </div>
          <Skeleton className="h-72 rounded-2xl lg:h-full lg:min-h-100" />
        </div>
      </section>
      <section className="container-page pt-24">
        <HeadingSkeleton />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="h-52 rounded-2xl" />
              <Skeleton className="mt-4 h-5 w-2/3" />
              <Skeleton className="mt-2 h-3.5 w-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
