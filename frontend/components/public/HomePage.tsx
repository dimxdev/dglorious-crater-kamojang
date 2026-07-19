'use client';

import Link from 'next/link';
import { Button, ImagePlaceholder } from '@/components/ui';
import { attractions, infoPraktis } from '@/lib/data/content';
import { rooms } from '@/lib/data/rooms';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { RoomCard } from './RoomCard';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <div>
      {/* HERO */}
      <section className="relative flex min-h-[620px] items-center overflow-hidden">
        <ImagePlaceholder
          icon="🌋"
          label="Foto kawah geothermal berkabut"
          className="absolute inset-0"
        />
        <div className="from-forest-900/85 via-forest-900/45 absolute inset-0 bg-linear-to-r to-transparent" />
        <div className="container-page relative w-full py-24">
          <div className="max-w-[640px] text-cream-100">
            <span className="bg-terracotta-500/90 inline-block rounded-full px-4 py-1.5 text-xs font-semibold tracking-[0.2em] uppercase">
              {t('hero.badge')}
            </span>
            <h1 className="mt-5 font-serif text-4xl leading-[1.05] font-extrabold sm:text-6xl">
              {t('hero.title')}
            </h1>
            <p className="mt-5 max-w-[520px] text-base font-light text-cream-100/90 sm:text-lg">
              {t('hero.subtitle')}
            </p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link href="/penginapan">
                <Button size="lg" variant="secondary">
                  {t('hero.ctaPrimary')}
                </Button>
              </Link>
              <Link href="/tentang">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cream-100/60 text-cream-100 hover:bg-white/10"
                >
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* DAYA TARIK */}
      <section className="container-page pt-24 pb-10">
        <div className="mx-auto max-w-[620px] text-center">
          <div className="eyebrow">{t('home.attractionsEyebrow')}</div>
          <h2 className="mt-3 font-serif text-3xl leading-tight font-bold sm:text-4xl">
            {t('home.attractionsTitle')}
          </h2>
        </div>
        <div className="mt-13 grid gap-5.5 sm:grid-cols-2 lg:grid-cols-4">
          {attractions.map((a) => (
            <div
              key={a.name}
              className="border-border overflow-hidden rounded-[20px] border bg-white shadow-[0_12px_30px_-22px_rgba(20,53,42,0.4)] transition-transform hover:-translate-y-1.5"
            >
              <div className="h-52">
                <ImagePlaceholder icon={a.icon} label={a.name} />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-xl font-semibold">{a.name}</h3>
                <p className="text-muted mt-1.5 text-[13.5px] leading-relaxed">
                  {a.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PENGINAPAN PREVIEW */}
      <section className="bg-surface-alt mt-16 py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <div className="eyebrow">{t('home.lodgingEyebrow')}</div>
              <h2 className="mt-3 font-serif text-3xl leading-tight font-bold sm:text-4xl">
                {t('home.lodgingTitle')}
              </h2>
            </div>
            <Link
              href="/penginapan"
              className="text-accent font-semibold whitespace-nowrap"
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
      <section className="container-page py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <div className="eyebrow">{t('home.infoEyebrow')}</div>
            <h2 className="mt-3 font-serif text-3xl leading-tight font-bold sm:text-4xl">
              {t('home.infoTitle')}
            </h2>
            <div className="mt-8 grid gap-4.5 sm:grid-cols-2">
              {infoPraktis.map((info) => (
                <div
                  key={info.title}
                  className="rounded-2xl border border-[#eee5d5] bg-white p-5"
                >
                  <div className="text-2xl">{info.icon}</div>
                  <div className="mt-2.5 font-semibold">{info.title}</div>
                  <div className="text-muted mt-1 text-sm">
                    {info.lines.map((l, i) => (
                      <div key={i}>{l}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[420px] overflow-hidden rounded-[22px] shadow-[0_20px_44px_-26px_rgba(20,53,42,0.5)]">
            <ImagePlaceholder icon="🗺️" label="Peta / foto lokasi" />
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="container-page pb-20">
        <div className="from-forest-700 to-forest-500 relative overflow-hidden rounded-[26px] bg-linear-to-br px-8 py-16 sm:px-14">
          <div className="max-w-[560px]">
            <h2 className="font-serif text-3xl leading-tight font-bold text-cream-100 sm:text-4xl">
              {t('home.ctaTitle')}
            </h2>
            <p className="mt-4 text-cream-100/85">{t('home.ctaSubtitle')}</p>
            <Link href="/penginapan" className="mt-6 inline-block">
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
