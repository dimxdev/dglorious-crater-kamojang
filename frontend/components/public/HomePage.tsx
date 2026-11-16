'use client';

import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createElement, useEffect, useState } from 'react';
import {
  ContourBand,
  Disclosure,
  HeadingSkeleton,
  RoomCardSkeleton,
  Skeleton,
  actionClass,
} from '@/components/public/ui';
import {
  fetchPublicRoomTypes,
  type PublicRoomTypeSummary,
} from '@/lib/api/roomTypes';
import {
  pickL,
  resolveContentImage,
  type SiteContent,
} from '@/lib/api/siteContent';
import type { Locale } from '@/lib/i18n/config';
import { resolveIcon } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useSiteContent } from '@/lib/useSiteContent';
import { RoomCard } from './RoomCard';

/**
 * Stat ketinggian di `about_intro` dipakai sebagai label pita kontur. Dicari
 * lewat labelnya, bukan urutannya: admin yang menyusun ulang stat tidak boleh
 * diam-diam mengganti angka yang tampil di bawah garis kontur. Kalau tidak ada
 * stat yang cocok, pita tampil tanpa label.
 */
function elevationLabel(content: SiteContent | null, locale: Locale) {
  const stat = content?.sections.about_intro.stats.find((st) =>
    /ketinggian|elevation|altitude/i.test(`${st.label.id} ${st.label.en}`),
  );
  return stat ? pickL(stat.value, locale) : undefined;
}

export function HomePage() {
  const { t, locale } = useTranslation();
  const { content, failed } = useSiteContent();
  const s = content?.sections;

  const attractions = (content?.collections.ATTRACTION ?? []).filter(
    (a) => a.content.featured,
  );
  const infoCards = content?.collections.INFO_CARD ?? [];
  const routes = content?.collections.ROUTE ?? [];
  const faq = content?.collections.FAQ ?? [];

  const heroImage = s?.home_hero.imageUrl
    ? resolveContentImage(s.home_hero.imageUrl)
    : null;
  const ctaImage = s?.home_cta.imageUrl
    ? resolveContentImage(s.home_cta.imageUrl)
    : null;
  const locationImage = s?.home_info.imageUrl
    ? resolveContentImage(s.home_info.imageUrl)
    : null;

  const [rooms, setRooms] = useState<PublicRoomTypeSummary[] | null>(null);
  useEffect(() => {
    let active = true;
    fetchPublicRoomTypes(locale)
      .then((data) => active && setRooms(data))
      .catch(() => active && setRooms([]));
    return () => {
      active = false;
    };
  }, [locale]);

  // Daya tarik unggulan pertama jadi kartu besar: urutannya diatur admin di
  // CMS, jadi bobot visualnya mengikuti item yang ditaruh paling atas.
  const [featured, ...secondary] = attractions;

  return (
    <div>
      {/* HERO — navbar melayang transparan di atasnya, jadi foto ini yang
          membuka halaman tanpa dipotong pita terang di puncaknya.

          `-mt-18` menariknya naik setinggi navbar (h-18): navbar `sticky`
          tetap memakan ruang di aliran layout, jadi tanpa ini yang tampak di
          balik navbar transparan adalah latar halaman yang terang — bukan
          fotonya — dan teks putih navbar jadi nyaris tak terbaca. Nilainya
          harus ikut tinggi navbar kalau suatu saat diubah. */}
      <section className="bg-moss-900 relative -mt-18 flex min-h-[min(92svh,46rem)] items-center overflow-hidden">
        {heroImage && (
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        )}
        <div className="from-moss-900/90 via-moss-900/55 absolute inset-0 bg-linear-to-r to-transparent" />
        <div className="from-moss-900/70 absolute inset-0 bg-linear-to-t to-transparent" />

        <div className="container-page relative w-full pt-28 pb-32">
          <div className="max-w-[42rem]">
            {s ? (
              <>
                <h1
                  data-enter
                  className="text-ash-50 font-serif text-[clamp(2.4rem,1.5rem+3.6vw,4.25rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance"
                >
                  {pickL(s.home_hero.title, locale)}
                </h1>
                <p
                  data-enter
                  style={{ '--enter-delay': '180ms' } as React.CSSProperties}
                  className="text-ash-50/85 mt-6 max-w-[34rem] text-[clamp(1rem,0.95rem+0.3vw,1.15rem)] leading-relaxed"
                >
                  {pickL(s.home_hero.subtitle, locale)}
                </p>
              </>
            ) : failed ? (
              /* Backend tidak terjangkau: judul diganti nama merek (teks UI,
                 bukan salinan bisnis) supaya navbar transparan tetap punya
                 latar gelap dan halaman tidak tampak rusak. */
              <h1 className="text-ash-50 font-serif text-[clamp(2.4rem,1.5rem+3.6vw,4.25rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance">
                {t('common.brand')}
              </h1>
            ) : (
              <div aria-hidden>
                <Skeleton className="bg-ash-50/15 h-12 w-full max-w-[22rem] sm:h-16" />
                <Skeleton className="bg-ash-50/15 mt-3 h-12 w-3/4 max-w-[16rem] sm:h-16" />
                <Skeleton className="bg-ash-50/15 mt-6 h-5 w-full max-w-[34rem]" />
                <Skeleton className="bg-ash-50/15 mt-2.5 h-5 w-4/5 max-w-[28rem]" />
              </div>
            )}
            <div
              data-enter
              style={{ '--enter-delay': '270ms' } as React.CSSProperties}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link href="/penginapan" className={actionClass('primary', 'lg')}>
                {t('hero.ctaPrimary')}
              </Link>
              <Link href="/tentang" className={actionClass('onPhoto', 'lg')}>
                {t('hero.ctaSecondary')}
              </Link>
            </div>
          </div>
        </div>

        {/* Kabut yang meleburkan foto hero ke latar halaman. */}
        <div className="haze-bottom" />
      </section>

      {/* DAYA TARIK — asimetris: unggulan besar, sisanya bertumpuk di kanan */}
      {failed ? (
        <p className="container-page text-ash-700 pt-24 text-[15px]">
          {t('common.loadError')}
        </p>
      ) : !s ? (
        <AttractionsSkeleton />
      ) : (
        <section className="container-page pt-24 pb-4">
          {featured && (
            <>
              <SectionHead
                title={pickL(s.home_attractions.title, locale)}
                linkHref="/tentang#atraksi"
                linkLabel={t('home.attractionsViewAll')}
              />

              <div className="mt-11 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
                <article className="bg-moss-900 group relative min-h-[26rem] overflow-hidden rounded-[22px] lg:min-h-[32rem]">
                  {featured.imageUrl && (
                    <Image
                      src={resolveContentImage(featured.imageUrl)}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 60vw, 100vw"
                      className="object-cover"
                    />
                  )}
                  <div className="from-moss-900/92 via-moss-900/30 absolute inset-0 bg-linear-to-t to-transparent" />
                  <div className="text-ash-50 absolute inset-x-0 bottom-0 p-7 sm:p-9">
                    <IconBadge name={featured.content.icon} />
                    <h3 className="mt-4 font-serif text-[1.7rem] leading-tight sm:text-3xl">
                      {pickL(featured.content.name, locale)}
                    </h3>
                    <p className="text-ash-50/85 mt-3 max-w-[46ch] text-sm leading-relaxed sm:text-[15px]">
                      {pickL(featured.content.desc, locale)}
                    </p>
                  </div>
                </article>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                  {secondary.map((a) => {
                    const Icon = resolveIcon(a.content.icon);
                    return (
                      /* Tanpa tepi dan tanpa bidang putih. Kartu di sini cuma
                         menambah dua garis yang bersaing dengan kontur di
                         bawahnya; foto dan jaraknya sendiri sudah cukup
                         menandai kelompok. */
                      <article
                        key={a.id}
                        className="group flex items-center gap-4 lg:flex-1"
                      >
                        <div className="bg-ash-200 relative h-20 w-24 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-28">
                          {a.imageUrl && (
                            <Image
                              src={resolveContentImage(a.imageUrl)}
                              alt=""
                              fill
                              sizes="112px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0 pr-2">
                          {/* items-start + offset: kalau judulnya turun jadi dua
                              baris (sering di layar kecil), ikonnya tetap sejajar
                              dengan baris pertama, bukan melayang di tengah. */}
                          <div className="flex items-start gap-2">
                            <Icon
                              size={15}
                              strokeWidth={1.5}
                              className="text-mineral-600 mt-[3px] shrink-0"
                              aria-hidden
                            />
                            <h3 className="text-ash-900 font-serif text-lg leading-tight">
                              {pickL(a.content.name, locale)}
                            </h3>
                          </div>
                          <p className="text-ash-600 mt-1.5 text-[13px] leading-relaxed">
                            {pickL(a.content.desc, locale)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Daftar di atas cuma sebagian kecil. Orang yang menimbang
              perjalanan satu setengah jam perlu tahu skalanya sebelum menutup
              tab ini. */}
          <div
            className={`border-ash-300 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t pt-6 ${featured ? 'mt-12' : ''}`}
          >
            <p className="text-ash-700 max-w-[52ch] text-[15px] leading-relaxed">
              {pickL(s.home_facilities_teaser.body, locale)}
            </p>
            <Link
              href="/tentang#fasilitas"
              className="text-mineral-600 hover:text-mineral-700 focus-visible:ring-mineral-500 -m-2 flex items-center gap-1.5 rounded p-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {t('home.facilitiesLink')}
              <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
            </Link>
          </div>
        </section>
      )}

      {/* Kontur menggantikan garis pemisah + pita putih yang dulu memisahkan
          seksi. Ini gerakan tegasnya: pemisahnya sendiri sekarang menyatakan
          medan tempat ini, dan sekaligus MEMBUANG dua tepi serta satu bidang
          warna dari halaman. Berani di sini berarti lebih sedikit, bukan
          lebih banyak. Datumnya nyata: ketinggian yang sama tampil di
          halaman Tentang (stat ketinggian di CMS). */}
      <ContourBand label={elevationLabel(content, locale)} />

      {/* PENGINAPAN */}
      <section className="pb-24">
        <div className="container-page">
          {s ? (
            <SectionHead
              title={pickL(s.home_lodging.title, locale)}
              sub={pickL(s.home_lodging.subtitle, locale)}
              linkHref="/penginapan"
              linkLabel={t('home.lodgingViewAll')}
            />
          ) : failed ? null : (
            <HeadingSkeleton lines={1} />
          )}
          <div
            className={`grid gap-6 md:grid-cols-2 lg:grid-cols-3 ${s || !failed ? 'mt-11' : ''}`}
          >
            {rooms === null
              ? [0, 1, 2].map((i) => <RoomCardSkeleton key={i} />)
              : rooms
                  .slice(0, 3)
                  .map((room) => (
                    <RoomCard
                      key={room.slug}
                      room={room}
                      variant="home"
                      t={t}
                    />
                  ))}
          </div>
        </div>
      </section>

      {/* INFO PRAKTIS */}
      {!failed && (
        <section className="container-page py-24">
          {!s ? (
            <InfoSkeleton />
          ) : (
            <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <h2 className="text-ash-900 max-w-[16ch] font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
                  {pickL(s.home_info.title, locale)}
                </h2>
                <div className="mt-9 grid gap-4 sm:grid-cols-2">
                  {infoCards.map((info) => {
                    const Icon = resolveIcon(info.content.icon);
                    const title = pickL(info.content.title, locale);
                    const lines = [info.content.line1, info.content.line2]
                      .map((l) => pickL(l, locale))
                      .filter(Boolean);
                    const linkLabel = info.content.linkLabel
                      ? pickL(info.content.linkLabel, locale)
                      : '';
                    const body = (
                      <>
                        <Icon
                          size={19}
                          strokeWidth={1.5}
                          className="text-mineral-600"
                          aria-hidden
                        />
                        <div className="text-ash-900 mt-3 font-semibold">
                          {title}
                        </div>
                        <div className="text-ash-600 mt-1.5 text-sm leading-relaxed">
                          {lines.map((l, i) => (
                            <div key={i}>{l}</div>
                          ))}
                        </div>
                        {info.content.href && linkLabel && (
                          <span className="text-mineral-600 group-hover:text-mineral-700 mt-3 flex items-center gap-1.5 text-sm font-semibold">
                            {linkLabel}
                            <ArrowRight
                              size={14}
                              strokeWidth={1.75}
                              aria-hidden
                            />
                          </span>
                        )}
                      </>
                    );
                    return info.content.href ? (
                      <Link
                        key={info.id}
                        href={info.content.href}
                        className="border-ash-300/70 hover:border-mineral-300 focus-visible:ring-mineral-500 group rounded-2xl border bg-white p-5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div
                        key={info.id}
                        className="border-ash-300/70 rounded-2xl border bg-white p-5"
                      >
                        {body}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="bg-ash-200 relative h-[26rem] overflow-hidden rounded-[22px]">
                {locationImage && (
                  <Image
                    src={locationImage}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 46vw, 100vw"
                    className="object-cover"
                  />
                )}
              </div>
            </div>
          )}
        </section>
      )}

      {/* CARA KE SINI — Kamojang bukan tempat yang orang lewati kebetulan;
          hampir semua tamu menempuh perjalanan satu jam lebih. "Berapa lama
          dan lewat mana" adalah pertanyaan yang menahan orang sebelum
          memutuskan, jadi jawabannya ditaruh di beranda, bukan dikubur. */}
      <ContourBand />
      {!failed && (
        <section className="pb-24">
          <div className="container-page">
            {!s ? (
              <RoutesSkeleton />
            ) : (
              <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr]">
                <div>
                  <h2 className="text-ash-900 max-w-[16ch] font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
                    {pickL(s.home_routes.title, locale)}
                  </h2>
                  <p className="text-ash-600 mt-4 max-w-[46ch] leading-relaxed">
                    {pickL(s.home_routes.lead, locale)}
                  </p>
                  {s.home_routes.mapsUrl && (
                    <a
                      href={s.home_routes.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={actionClass('quiet', 'md', 'mt-7')}
                    >
                      {t('footer.openMaps')}
                      <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden />
                    </a>
                  )}
                </div>

                <dl className="divide-ash-200 border-ash-200 divide-y border-y">
                  {routes.map((r) => (
                    <div key={r.id} className="py-6 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <dt className="text-ash-900 font-serif text-lg">
                          {pickL(r.content.from, locale)}
                        </dt>
                        <dd className="text-mineral-700 text-sm font-semibold">
                          {pickL(r.content.duration, locale)}
                          <span className="text-ash-600 font-normal">
                            {' '}
                            · {pickL(r.content.distance, locale)}
                          </span>
                        </dd>
                      </div>
                      <p className="text-ash-600 mt-2 max-w-[52ch] text-[13.5px] leading-relaxed">
                        {pickL(r.content.note, locale)}
                      </p>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </section>
      )}

      {/* FAQ — situs tidak punya booking online, jadi tiap reservasi lewat
          percakapan WhatsApp. Pertanyaan yang sudah terjawab di sini adalah
          satu bolak-balik chat yang tidak perlu terjadi. Isinya dikelola
          admin di CMS dan diturunkan dari S&K resmi klien. */}
      {!failed && (
        <section className="container-page py-24">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              {s ? (
                <>
                  <h2 className="text-ash-900 max-w-[14ch] font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
                    {pickL(s.home_faq.title, locale)}
                  </h2>
                  <p className="text-ash-600 mt-4 max-w-[40ch] leading-relaxed">
                    {pickL(s.home_faq.lead, locale)}
                  </p>
                  <Link
                    href="/syarat-ketentuan"
                    className={actionClass('quiet', 'md', 'mt-7')}
                  >
                    {t('footer.terms')}
                  </Link>
                </>
              ) : (
                <HeadingSkeleton lines={2} />
              )}
            </div>
            <div className="border-ash-300/70 border-t">
              {s ? (
                faq.map((item) => (
                  <Disclosure
                    key={item.id}
                    question={pickL(item.content.q, locale)}
                    answer={pickL(item.content.a, locale)}
                  />
                ))
              ) : (
                <div aria-hidden>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="border-ash-300/70 border-b py-5">
                      <Skeleton className="h-5 w-4/5" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA — membalas kabut hero di ujung halaman */}
      {!failed && (
        <section className="bg-moss-900 relative isolate overflow-hidden">
          {ctaImage && (
            <Image
              src={ctaImage}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-[50%_65%]"
            />
          )}
          <div className="bg-moss-900/82 absolute inset-0" />
          <div className="haze-top" />
          <div className="container-page relative py-24 sm:py-28">
            <div className="max-w-[34rem]">
              {s ? (
                <>
                  <h2 className="text-ash-50 font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
                    {pickL(s.home_cta.title, locale)}
                  </h2>
                  <p className="text-ash-50/80 mt-4 leading-relaxed">
                    {pickL(s.home_cta.subtitle, locale)}
                  </p>
                </>
              ) : (
                <div aria-hidden>
                  <Skeleton className="bg-ash-50/15 h-10 w-full max-w-[22rem] sm:h-14" />
                  <Skeleton className="bg-ash-50/15 mt-5 h-4 w-full" />
                  <Skeleton className="bg-ash-50/15 mt-2.5 h-4 w-4/5" />
                </div>
              )}
              <Link
                href="/penginapan"
                className={actionClass('primary', 'lg', 'mt-8')}
              >
                {t('home.ctaButton')}
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Kepala seksi beranda. Kicker huruf-besar sengaja TIDAK dipakai di sini —
 * label itu disimpan untuk mast halaman interior, dipakai sekali per halaman.
 * Eyebrow di atas setiap seksi cuma jadi tata bahasa yang tidak dipilih.
 */
function SectionHead({
  title,
  sub,
  linkHref,
  linkLabel,
}: {
  title: string;
  /** Satu kalimat faktual di bawah judul — dipakai kalau seksi ini menampilkan
   *  sebagian dari yang tersedia, supaya pembaca tahu ada berapa seluruhnya. */
  sub?: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
      <div>
        <h2 className="text-ash-900 max-w-[15ch] font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
          {title}
        </h2>
        {sub && (
          <p className="text-ash-600 mt-3 max-w-[46ch] text-[15px] leading-relaxed">
            {sub}
          </p>
        )}
      </div>
      <Link
        href={linkHref}
        className="text-mineral-600 hover:text-mineral-700 focus-visible:ring-mineral-500 -m-2 flex items-center gap-1.5 rounded p-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        {linkLabel}
        <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
      </Link>
    </div>
  );
}

/** Penanda ikon kecil di kartu daya tarik utama. */
function IconBadge({ name }: { name: string }) {
  return (
    <span className="ring-ash-50/25 bg-ash-50/15 inline-flex h-9 w-9 items-center justify-center rounded-full ring-1">
      {createElement(resolveIcon(name), {
        size: 17,
        strokeWidth: 1.5,
        'aria-hidden': true,
      })}
    </span>
  );
}

// Skeleton seksi beranda. Tinggi dan kolomnya mengikuti seksi aslinya supaya
// tidak ada lonjakan saat konten CMS datang.

function AttractionsSkeleton() {
  return (
    <section className="container-page pt-24 pb-4" aria-hidden>
      <HeadingSkeleton />
      <div className="mt-11 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <Skeleton className="min-h-[26rem] rounded-[22px] lg:min-h-[32rem]" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-4 lg:flex-1">
              <Skeleton className="h-20 w-24 shrink-0 rounded-xl sm:h-24 sm:w-28" />
              <div className="flex-1">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-2.5 h-3.5 w-full" />
                <Skeleton className="mt-2 h-3.5 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InfoSkeleton() {
  return (
    <div
      className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]"
      aria-hidden
    >
      <div>
        <HeadingSkeleton />
        <div className="mt-9 grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
      <Skeleton className="h-[26rem] rounded-[22px]" />
    </div>
  );
}

function RoutesSkeleton() {
  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr]" aria-hidden>
      <HeadingSkeleton lines={2} />
      <div className="divide-ash-200 border-ash-200 divide-y border-y">
        {[0, 1].map((i) => (
          <div key={i} className="py-6 first:pt-0 last:pb-0">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="mt-3 h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
