'use client';

import Image from 'next/image';
import Link from 'next/link';
import { createElement } from 'react';
import { Button } from '@/components/ui';
import { getFeaturedAttractions, getInfoPraktis } from '@/lib/data/content';
import { getImage } from '@/lib/data/images';
import { localizeRooms } from '@/lib/data/rooms';
import { getIcon, type IconName } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useReveal } from '@/lib/useReveal';
import { RoomCard } from './RoomCard';

export function HomePage() {
  const { t, locale } = useTranslation();

  const attractions = getFeaturedAttractions(locale);
  const infoPraktis = getInfoPraktis(locale);
  const rooms = localizeRooms(locale);

  // Daya tarik pertama (kawah) jadi kartu besar — dia memang daya tarik utama
  // sekaligus asal nama tempatnya, jadi bobot visualnya punya alasan.
  const [featured, ...secondary] = attractions;
  const featuredPhoto = getImage(featured.photo);
  const heroPhoto = getImage('hero');
  const locationPhoto = getImage('locationValley');

  const attractionsRef = useReveal<HTMLElement>();
  const lodgingRef = useReveal<HTMLElement>();
  const infoRef = useReveal<HTMLElement>();
  const ctaRef = useReveal<HTMLElement>();

  return (
    <div>
      {/* HERO */}
      <section className="relative flex min-h-[640px] items-center overflow-hidden">
        <Image
          src={heroPhoto.src}
          alt={heroPhoto.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: heroPhoto.objectPosition }}
        />
        <div className="from-basalt-900/85 via-basalt-900/45 absolute inset-0 bg-linear-to-r to-transparent" />
        <div className="container-page relative w-full py-24">
          <div className="max-w-[640px] text-stone-50">
            <span className="inline-block rounded-full bg-teal-600 px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase">
              {t('hero.badge')}
            </span>
            <h1 className="mt-6 font-serif text-[2.6rem] leading-[1.06] font-normal sm:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-5 max-w-[520px] text-base text-stone-50/85 sm:text-lg">
              {t('hero.subtitle')}
            </p>
            <div className="mt-9 flex flex-wrap gap-3.5">
              <Link href="/penginapan">
                <Button size="lg" variant="secondary">
                  {t('hero.ctaPrimary')}
                </Button>
              </Link>
              <Link href="/tentang">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-stone-50/60 text-stone-50 hover:bg-white/10"
                >
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
        {/* Kabut yang meleburkan foto hero ke latar halaman */}
        <div className="mist-edge" />
      </section>

      {/* DAYA TARIK — asimetris: kawah besar, tiga sisanya bertumpuk di kanan */}
      <section
        ref={attractionsRef}
        data-reveal
        className="container-page pt-24 pb-10"
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-155">
            <div className="eyebrow">{t('home.attractionsEyebrow')}</div>
            <h2 className="mt-3 font-serif text-3xl leading-tight font-normal sm:text-[2.6rem]">
              {t('home.attractionsTitle')}
            </h2>
          </div>
          <Link
            href="/tentang#atraksi"
            className="text-accent hover:text-accent-hover font-semibold whitespace-nowrap transition-colors"
          >
            {t('home.attractionsViewAll')}
          </Link>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.55fr_1fr]">
          {/* Kartu utama: foto dominan, judul & deskripsi di atas scrim */}
          <article className="group relative min-h-[420px] overflow-hidden rounded-[22px] lg:min-h-[520px]">
            <Image
              src={featuredPhoto.src}
              alt={featuredPhoto.alt}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
              style={{ objectPosition: featuredPhoto.objectPosition }}
            />
            <div className="from-basalt-900/90 via-basalt-900/25 absolute inset-0 bg-linear-to-t to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-stone-50 sm:p-9">
              <IconBadge name={featured.icon} />
              <h3 className="mt-4 font-serif text-[26px] leading-tight font-medium sm:text-3xl">
                {featured.name}
              </h3>
              <p className="mt-2.5 max-w-[46ch] text-sm leading-relaxed text-stone-50/85 sm:text-[15px]">
                {featured.desc}
              </p>
            </div>
          </article>

          {/* Tiga daya tarik lain: baris ringkas foto + judul + satu deskripsi */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {secondary.map((a) => {
              const Icon = getIcon(a.icon);
              const photo = getImage(a.photo);
              return (
                <article
                  key={a.name}
                  className="group border-border flex items-center gap-4 overflow-hidden rounded-[18px] border bg-white p-3 transition-colors duration-300 hover:border-stone-400 lg:flex-1"
                >
                  <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl sm:h-24 sm:w-28">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="112px"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                      style={{ objectPosition: photo.objectPosition }}
                    />
                  </div>
                  <div className="min-w-0 pr-2">
                    {/* items-start + offset: kalau judulnya turun jadi dua baris
                        (sering terjadi di layar kecil), ikonnya tetap sejajar
                        dengan baris pertama, bukan melayang di tengah. */}
                    <div className="flex items-start gap-2">
                      <Icon
                        size={15}
                        strokeWidth={1.5}
                        className="text-accent mt-[3px] shrink-0"
                        aria-hidden
                      />
                      <h3 className="font-serif text-lg leading-tight font-medium">
                        {a.name}
                      </h3>
                    </div>
                    <p className="text-muted mt-1.5 text-[13px] leading-relaxed">
                      {a.desc}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* PENGINAPAN PREVIEW */}
      <section
        ref={lodgingRef}
        data-reveal
        className="bg-surface-alt mt-16 py-24"
      >
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="eyebrow">{t('home.lodgingEyebrow')}</div>
              <h2 className="mt-3 font-serif text-3xl leading-tight font-normal sm:text-[2.6rem]">
                {t('home.lodgingTitle')}
              </h2>
            </div>
            <Link
              href="/penginapan"
              className="text-accent hover:text-accent-hover font-semibold whitespace-nowrap transition-colors"
            >
              {t('home.lodgingViewAll')}
            </Link>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <RoomCard key={room.slug} room={room} variant="home" t={t} />
            ))}
          </div>
        </div>
      </section>

      {/* INFO PRAKTIS */}
      <section ref={infoRef} data-reveal className="container-page py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="eyebrow">{t('home.infoEyebrow')}</div>
            <h2 className="mt-3 font-serif text-3xl leading-tight font-normal sm:text-[2.6rem]">
              {t('home.infoTitle')}
            </h2>
            <div className="mt-8 grid gap-4.5 sm:grid-cols-2">
              {infoPraktis.map((info) => {
                const Icon = getIcon(info.icon);
                const content = (
                  <>
                    <Icon
                      size={20}
                      strokeWidth={1.5}
                      className="text-accent"
                      aria-hidden
                    />
                    <div className="mt-3 font-semibold">{info.title}</div>
                    <div className="text-muted mt-1 text-sm">
                      {info.lines.map((l, i) => (
                        <div key={i}>{l}</div>
                      ))}
                    </div>
                    {info.linkLabel && (
                      <div className="text-accent group-hover:text-accent-hover mt-2.5 flex items-center gap-1 text-sm font-semibold">
                        {info.linkLabel}
                        <span aria-hidden>→</span>
                      </div>
                    )}
                  </>
                );
                return info.href ? (
                  <Link
                    key={info.title}
                    href={info.href}
                    className="border-border hover:border-accent group rounded-2xl border bg-white p-5 transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <div
                    key={info.title}
                    className="border-border rounded-2xl border bg-white p-5"
                  >
                    {content}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative h-[420px] overflow-hidden rounded-[22px] shadow-[0_20px_44px_-28px_rgba(23,20,15,0.5)]">
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

      {/* CTA STRIP — full-bleed, membalas kabut hero di ujung halaman */}
      <section
        ref={ctaRef}
        data-reveal
        className="relative isolate overflow-hidden"
      >
        <Image
          src={heroPhoto.src}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          className="object-cover object-[50%_65%]"
        />
        <div className="bg-basalt-900/78 absolute inset-0" />
        <div className="mist-edge-top" />
        <div className="container-page relative py-24 sm:py-28">
          <div className="max-w-[560px]">
            <h2 className="font-serif text-3xl leading-tight font-normal text-stone-50 sm:text-[2.6rem]">
              {t('home.ctaTitle')}
            </h2>
            <p className="mt-4 text-stone-50/80">{t('home.ctaSubtitle')}</p>
            <Link href="/penginapan" className="mt-7 inline-block">
              <Button size="lg" variant="secondary">
                {t('home.ctaButton')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Penanda ikon kecil di kartu daya tarik utama. */
function IconBadge({ name }: { name: IconName }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-stone-50/15 ring-1 ring-stone-50/25">
      {createElement(getIcon(name), {
        size: 17,
        strokeWidth: 1.5,
        'aria-hidden': true,
      })}
    </span>
  );
}
