'use client';

import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createElement, useEffect, useState } from 'react';
import {
  ContourBand,
  Disclosure,
  RoomCardSkeleton,
  actionClass,
} from '@/components/public/ui';
import {
  fetchPublicRoomTypes,
  type PublicRoomTypeSummary,
} from '@/lib/api/roomTypes';
import { getFeaturedAttractions, getInfoPraktis } from '@/lib/data/content';
import { getImage } from '@/lib/data/images';
import { MAPS_URL, getFaq, getRoutes } from '@/lib/data/visit';
import { getIcon, type IconName } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { RoomCard } from './RoomCard';

export function HomePage() {
  const { t, locale } = useTranslation();

  const attractions = getFeaturedAttractions(locale);
  const infoPraktis = getInfoPraktis(locale);
  const routes = getRoutes(locale);
  const faq = getFaq(locale);

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

  // Daya tarik pertama (kawah) jadi kartu besar — dia memang daya tarik utama
  // sekaligus asal nama tempatnya, jadi bobot visualnya punya alasan.
  const [featured, ...secondary] = attractions;
  const featuredPhoto = getImage(featured.photo);
  const heroPhoto = getImage('hero');
  const locationPhoto = getImage('locationValley');

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
        <Image
          src={heroPhoto.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: heroPhoto.objectPosition }}
        />
        <div className="from-moss-900/90 via-moss-900/55 absolute inset-0 bg-linear-to-r to-transparent" />
        <div className="from-moss-900/70 absolute inset-0 bg-linear-to-t to-transparent" />

        <div className="container-page relative w-full pt-28 pb-32">
          <div className="max-w-[42rem]">
            <h1
              data-enter
              className="text-ash-50 font-serif text-[clamp(2.4rem,1.5rem+3.6vw,4.25rem)] leading-[1.04] font-normal tracking-[-0.025em] text-balance"
            >
              {t('hero.title')}
            </h1>
            <p
              data-enter
              style={{ '--enter-delay': '180ms' } as React.CSSProperties}
              className="text-ash-50/85 mt-6 max-w-[34rem] text-[clamp(1rem,0.95rem+0.3vw,1.15rem)] leading-relaxed"
            >
              {t('hero.subtitle')}
            </p>
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

      {/* DAYA TARIK — asimetris: kawah besar, tiga sisanya bertumpuk di kanan */}
      <section className="container-page pt-24 pb-4">
        <SectionHead
          title={t('home.attractionsTitle')}
          linkHref="/tentang#atraksi"
          linkLabel={t('home.attractionsViewAll')}
        />

        <div className="mt-11 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          <article className="bg-moss-900 group relative min-h-[26rem] overflow-hidden rounded-[22px] lg:min-h-[32rem]">
            <Image
              src={featuredPhoto.src}
              alt={featuredPhoto.alt}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover"
              style={{ objectPosition: featuredPhoto.objectPosition }}
            />
            <div className="from-moss-900/92 via-moss-900/30 absolute inset-0 bg-linear-to-t to-transparent" />
            <div className="text-ash-50 absolute inset-x-0 bottom-0 p-7 sm:p-9">
              <IconBadge name={featured.icon} />
              <h3 className="mt-4 font-serif text-[1.7rem] leading-tight sm:text-3xl">
                {featured.name}
              </h3>
              <p className="text-ash-50/85 mt-3 max-w-[46ch] text-sm leading-relaxed sm:text-[15px]">
                {featured.desc}
              </p>
            </div>
          </article>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {secondary.map((a) => {
              const Icon = getIcon(a.icon);
              const photo = getImage(a.photo);
              return (
                /* Tanpa tepi dan tanpa bidang putih. Kartu di sini cuma
                   menambah dua garis yang bersaing dengan kontur di bawahnya;
                   foto dan jaraknya sendiri sudah cukup menandai kelompok. */
                <article
                  key={a.name}
                  className="group flex items-center gap-4 lg:flex-1"
                >
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-28">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="112px"
                      className="object-cover"
                      style={{ objectPosition: photo.objectPosition }}
                    />
                  </div>
                  <div className="min-w-0 pr-2">
                    {/* items-start + offset: kalau judulnya turun jadi dua baris
                        (sering di layar kecil), ikonnya tetap sejajar dengan
                        baris pertama, bukan melayang di tengah. */}
                    <div className="flex items-start gap-2">
                      <Icon
                        size={15}
                        strokeWidth={1.5}
                        className="text-mineral-600 mt-[3px] shrink-0"
                        aria-hidden
                      />
                      <h3 className="text-ash-900 font-serif text-lg leading-tight">
                        {a.name}
                      </h3>
                    </div>
                    <p className="text-ash-600 mt-1.5 text-[13px] leading-relaxed">
                      {a.desc}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Empat daya tarik di atas cuma sebagian kecil. Orang yang menimbang
            perjalanan satu setengah jam perlu tahu skalanya sebelum menutup
            tab ini — dan angka itulah jawabannya. */}
        <div className="border-ash-300 mt-12 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3 border-t pt-6">
          <p className="text-ash-700 max-w-[52ch] text-[15px] leading-relaxed">
            {t('home.facilitiesTeaser')}
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

      {/* Kontur menggantikan garis pemisah + pita putih yang dulu memisahkan
          seksi. Ini gerakan tegasnya: pemisahnya sendiri sekarang menyatakan
          medan tempat ini, dan sekaligus MEMBUANG dua tepi serta satu bidang
          warna dari halaman. Berani di sini berarti lebih sedikit, bukan
          lebih banyak. Datumnya nyata — ketinggian yang sama dipakai di
          halaman Tentang. */}
      <ContourBand label={t('about.statElevationValue')} />

      {/* PENGINAPAN */}
      <section className="pb-24">
        <div className="container-page">
          <SectionHead
            title={t('home.lodgingTitle')}
            sub={t('home.lodgingSub')}
            linkHref="/penginapan"
            linkLabel={t('home.lodgingViewAll')}
          />
          <div className="mt-11 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms === null
              ? [0, 1, 2].map((i) => <RoomCardSkeleton key={i} />)
              : rooms
                  .slice(0, 3)
                  .map((room) => (
                    <RoomCard key={room.slug} room={room} variant="home" t={t} />
                  ))}
          </div>
        </div>
      </section>

      {/* INFO PRAKTIS */}
      <section className="container-page py-24">
        <div className="grid items-center gap-14 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <h2 className="text-ash-900 max-w-[16ch] font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
              {t('home.infoTitle')}
            </h2>
            <div className="mt-9 grid gap-4 sm:grid-cols-2">
              {infoPraktis.map((info) => {
                const Icon = getIcon(info.icon);
                const body = (
                  <>
                    <Icon
                      size={19}
                      strokeWidth={1.5}
                      className="text-mineral-600"
                      aria-hidden
                    />
                    <div className="text-ash-900 mt-3 font-semibold">{info.title}</div>
                    <div className="text-ash-600 mt-1.5 text-sm leading-relaxed">
                      {info.lines.map((l, i) => (
                        <div key={i}>{l}</div>
                      ))}
                    </div>
                    {info.linkLabel && (
                      <span className="text-mineral-600 group-hover:text-mineral-700 mt-3 flex items-center gap-1.5 text-sm font-semibold">
                        {info.linkLabel}
                        <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
                      </span>
                    )}
                  </>
                );
                return info.href ? (
                  <Link
                    key={info.title}
                    href={info.href}
                    className="border-ash-300/70 hover:border-mineral-300 focus-visible:ring-mineral-500 group rounded-2xl border bg-white p-5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    key={info.title}
                    className="border-ash-300/70 rounded-2xl border bg-white p-5"
                  >
                    {body}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative h-[26rem] overflow-hidden rounded-[22px]">
            <Image
              src={locationPhoto.src}
              alt={locationPhoto.alt}
              fill
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="object-cover"
              style={{ objectPosition: locationPhoto.objectPosition }}
            />
          </div>
        </div>
      </section>

      {/* CARA KE SINI — Kamojang bukan tempat yang orang lewati kebetulan;
          hampir semua tamu menempuh perjalanan satu jam lebih. "Berapa lama
          dan lewat mana" adalah pertanyaan yang menahan orang sebelum
          memutuskan, jadi jawabannya ditaruh di beranda, bukan dikubur. */}
      <ContourBand />
      <section className="pb-24">
        <div className="container-page">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr]">
            <div>
              <h2 className="text-ash-900 max-w-[16ch] font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
                {t('visit.routeTitle')}
              </h2>
              <p className="text-ash-600 mt-4 max-w-[46ch] leading-relaxed">
                {t('visit.routeLead')}
              </p>
              <a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass('quiet', 'md', 'mt-7')}
              >
                {t('footer.openMaps')}
                <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden />
              </a>
            </div>

            <dl className="divide-ash-200 border-ash-200 divide-y border-y">
              {routes.map((r) => (
                <div key={r.from} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <dt className="text-ash-900 font-serif text-lg">{r.from}</dt>
                    <dd className="text-mineral-700 text-sm font-semibold">
                      {r.duration}
                      <span className="text-ash-600 font-normal"> · {r.distance}</span>
                    </dd>
                  </div>
                  <p className="text-ash-600 mt-2 max-w-[52ch] text-[13.5px] leading-relaxed">
                    {r.note}
                  </p>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* FAQ — situs tidak punya booking online, jadi tiap reservasi lewat
          percakapan WhatsApp. Pertanyaan yang sudah terjawab di sini adalah
          satu bolak-balik chat yang tidak perlu terjadi. Semua jawabannya
          diturunkan dari 12 poin S&K resmi klien (lihat lib/data/visit.ts). */}
      <section className="container-page py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.35fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-ash-900 max-w-[14ch] font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
              {t('visit.faqTitle')}
            </h2>
            <p className="text-ash-600 mt-4 max-w-[40ch] leading-relaxed">
              {t('visit.faqLead')}
            </p>
            <Link href="/syarat-ketentuan" className={actionClass('quiet', 'md', 'mt-7')}>
              {t('footer.terms')}
            </Link>
          </div>
          <div className="border-ash-300/70 border-t">
            {faq.map((item) => (
              <Disclosure key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA — membalas kabut hero di ujung halaman */}
      <section className="bg-moss-900 relative isolate overflow-hidden">
        <Image
          src={heroPhoto.src}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[50%_65%]"
        />
        <div className="bg-moss-900/82 absolute inset-0" />
        <div className="haze-top" />
        <div className="container-page relative py-24 sm:py-28">
          <div className="max-w-[34rem]">
            <h2 className="text-ash-50 font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-ash-50/80 mt-4 leading-relaxed">
              {t('home.ctaSubtitle')}
            </p>
            <Link href="/penginapan" className={actionClass('primary', 'lg', 'mt-8')}>
              {t('home.ctaButton')}
            </Link>
          </div>
        </div>
      </section>
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
function IconBadge({ name }: { name: IconName }) {
  return (
    <span className="ring-ash-50/25 bg-ash-50/15 inline-flex h-9 w-9 items-center justify-center rounded-full ring-1">
      {createElement(getIcon(name), {
        size: 17,
        strokeWidth: 1.5,
        'aria-hidden': true,
      })}
    </span>
  );
}
