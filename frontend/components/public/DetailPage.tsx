'use client';

import { BedDouble, ChevronRight, Info, Tent, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageMast, Skeleton, actionClass } from '@/components/public/ui';
import { ApiError } from '@/lib/api/client';
import {
  fetchPublicRoomTypeBySlug,
  resolveImageUrl,
  type PublicRoomImage,
  type PublicRoomTypeDetail,
} from '@/lib/api/roomTypes';
import { cn } from '@/lib/cn';
import { getImage, type SourcedImage } from '@/lib/data/images';
import { formatIDR } from '@/lib/format';
import { getIcon, type IconName } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { usePublicSettings, waLink } from '@/lib/usePublicSettings';

// Fase 1: belum ada booking online, jadi CTA mengarah ke WhatsApp reservasi
// (bukan form booking). Nomor & jam check-in/out dari `GET /settings`
// (§8.3 PROJECT.md) — config global, bukan bagian dari room-types.

export function DetailPage({ slug }: { slug: string }) {
  const { t, locale } = useTranslation();
  const [room, setRoom] = useState<PublicRoomTypeDetail | null>(null);
  const [notFoundState, setNotFoundState] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { settings } = usePublicSettings();

  useEffect(() => {
    let active = true;
    setRoom(null);
    setNotFoundState(false);
    setError(null);

    fetchPublicRoomTypeBySlug(slug, locale)
      .then((data) => active && setRoom(data))
      .catch((e) => {
        if (!active) return;
        if (e instanceof ApiError && e.status === 404) setNotFoundState(true);
        else setError(e instanceof Error ? e.message : t('common.loadError'));
      });
    return () => {
      active = false;
    };
  }, [slug, locale, t]);

  if (notFoundState) {
    return (
      <EmptyShell
        title={t('detail.notFound')}
        body={t('detail.notFoundHint')}
        actionLabel={t('detail.backToList')}
      />
    );
  }

  if (error) {
    return (
      <EmptyShell
        title={t('common.loadError')}
        body={error}
        actionLabel={t('detail.backToList')}
      />
    );
  }

  if (!room || !settings) return <DetailSkeleton />;

  const cover = room.images.find((i) => i.isCover) ?? room.images[0];
  const otherImages = room.images.filter((i) => i !== cover);
  // Kalau foto unit belum lengkap (< 3), sisa slot dipinjam dari foto umum
  // lokasi/atraksi — bukan dari unit lain, supaya tidak terkesan menampilkan
  // unit yang salah. Ini aset statis situs, bukan data unit.
  const ambience = [getImage('attractionAirPanas'), getImage('locationValley')];

  const waHref = waLink(
    settings.whatsapp_number,
    `Halo D’Glorious Crater, saya ingin tanya ketersediaan & booking untuk ${room.name}.`,
  );

  return (
    <div className="pb-24">
      <PageMast
        title={room.name}
        lead={room.description ?? undefined}
        meta={[
          { label: t('detail.categoryLabel'), value: room.category },
          {
            label: t('detail.baseCapacity'),
            value: t('common.guestsCount', { count: room.capacity }),
          },
          ...(room.bedInfo
            ? [{ label: t('detail.bedInfo'), value: room.bedInfo }]
            : []),
          { label: t('detail.checkIn'), value: settings.check_in_time },
          { label: t('detail.checkOut'), value: settings.check_out_time },
        ]}
      >
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="text-ash-600 flex items-center gap-1.5 text-[13px]">
            <li>
              <Link
                href="/penginapan"
                className="hover:text-mineral-700 transition-colors"
              >
                {t('nav.lodging')}
              </Link>
            </li>
            <ChevronRight size={13} strokeWidth={1.75} aria-hidden />
            <li className="text-ash-700" aria-current="page">
              {room.name}
            </li>
          </ol>
        </nav>
      </PageMast>

      {/* GALERI — grid 3-foto di md ke atas; di bawah itu satu kolom nggak
          cukup lebar buat foto samping, jadi diganti slider geser sendiri
          (`GalleryMobileSlider`) yang menampilkan set foto SAMA PERSIS
          (cover + 2 lainnya, fallback ambience kalau unit belum lengkap
          fotonya) — bukan cuma cover-nya doang seperti sebelumnya. */}
      <div className="container-page pt-10">
        <div className="hidden h-[30rem] grid-cols-[2fr_1fr] gap-3 md:grid">
          <figure className="relative overflow-hidden rounded-2xl">
            {cover ? (
              <Image
                src={resolveImageUrl(cover.url)}
                alt={t('detail.photoAlt', { name: room.name })}
                fill
                sizes="62vw"
                priority
                className="object-cover"
              />
            ) : (
              <div className="bg-ash-200 text-ash-500 flex h-full w-full items-center justify-center">
                <Tent size={38} strokeWidth={1.25} aria-hidden />
              </div>
            )}
          </figure>
          <div className="grid grid-rows-2 gap-3">
            {[0, 1].map((i) => {
              const own = otherImages[i];
              const fallback = ambience[i];
              return (
                <figure key={i} className="relative overflow-hidden rounded-2xl">
                  <Image
                    src={own ? resolveImageUrl(own.url) : fallback.src}
                    alt={own ? t('detail.photoAlt', { name: room.name }) : fallback.alt}
                    fill
                    sizes="30vw"
                    className="object-cover"
                    style={own ? undefined : { objectPosition: fallback.objectPosition }}
                  />
                </figure>
              );
            })}
          </div>
        </div>

        <GalleryMobileSlider
          cover={cover}
          otherImages={otherImages}
          ambience={ambience}
          roomName={room.name}
          photoAlt={(name) => t('detail.photoAlt', { name })}
        />
      </div>

      <div className="container-page mt-14 grid gap-14 lg:grid-cols-[1fr_23rem]">
        <div className="min-w-0">
          {/* KAPASITAS & TARIF TAMBAH ORANG — baris berpembatas garis, bukan
              kotak di dalam kotak. Kartu bersarang selalu memperlemah
              hierarki: dua tepi bersaing menandai batas yang sama. */}
          <section>
            <h2 className="text-ash-900 font-serif text-2xl">
              {t('detail.capacityTitle')}
            </h2>
            <dl className="divide-ash-200 border-ash-200 mt-5 divide-y border-y">
              <Row
                icon={<Users size={18} strokeWidth={1.5} aria-hidden />}
                label={t('detail.baseCapacity')}
                value={t('common.guestsCount', { count: room.capacity })}
              />
              {room.bedInfo && (
                <Row
                  icon={<BedDouble size={18} strokeWidth={1.5} aria-hidden />}
                  label={t('detail.bedInfo')}
                  value={room.bedInfo}
                />
              )}
              {room.extraFlatPrice != null ? (
                <Row
                  label={t('detail.extraFlatLabel')}
                  value={formatIDR(room.extraFlatPrice)}
                />
              ) : (
                <>
                  <Row
                    label={t('detail.withBed')}
                    value={formatIDR(room.extraBedPrice ?? 0)}
                  />
                  <Row
                    label={t('detail.withoutBed')}
                    value={formatIDR(room.extraNoBedPrice ?? 0)}
                  />
                </>
              )}
            </dl>

            <div className="border-mineral-200 bg-mineral-50 mt-5 flex gap-3 rounded-xl border p-4">
              <Info
                size={17}
                strokeWidth={1.5}
                className="text-mineral-600 mt-0.5 shrink-0"
                aria-hidden
              />
              <div>
                <div className="text-ash-900 text-[13.5px] font-semibold">
                  {t('detail.childrenRuleTitle')}
                </div>
                <p className="text-ash-700 mt-1 max-w-[60ch] text-[13px] leading-relaxed">
                  {t('detail.childrenRule')}
                </p>
              </div>
            </div>
          </section>

          {/* FASILITAS */}
          <section className="mt-14">
            <h2 className="text-ash-900 font-serif text-2xl">
              {t('detail.facilities')}
            </h2>
            {room.bathroomInfo && (
              <p className="text-ash-600 mt-1.5 text-[13px]">{room.bathroomInfo}</p>
            )}
            <ul className="mt-5 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
              {room.facilities.map((f) => {
                const Icon = getIcon(f.icon as IconName);
                return (
                  <li
                    key={f.label}
                    className="text-ash-800 flex items-center gap-3 text-[14.5px]"
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.5}
                      className="text-mineral-600 shrink-0"
                      aria-hidden
                    />
                    {f.label}
                  </li>
                );
              })}
            </ul>
            <p className="text-ash-600 mt-5 max-w-[62ch] text-[13px] leading-relaxed">
              {t('detail.universalFacilitiesNote')}{' '}
              <Link
                href="/tentang#fasilitas"
                className="text-mineral-600 hover:text-mineral-700 font-medium underline underline-offset-2"
              >
                {t('detail.universalFacilitiesLink')}
              </Link>
            </p>
          </section>

          {room.rules && (
            <section className="mt-14">
              <h2 className="text-ash-900 font-serif text-2xl">{t('detail.rules')}</h2>
              <p className="text-ash-700 mt-4 max-w-[62ch] text-[14.5px] leading-[1.8]">
                {room.rules}
              </p>
            </section>
          )}
        </div>

        {/* KARTU HARGA — menempel saat digulir supaya CTA WhatsApp tetap
            terjangkau sepanjang halaman detail yang panjang. */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="border-ash-300/70 rounded-[22px] border bg-white p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-ash-600 text-[11.5px] tracking-[0.1em] uppercase">
                  {t('detail.priceWeekday')}
                </div>
                <div className="text-ash-900 mt-1.5 font-serif text-[1.4rem] leading-none">
                  {formatIDR(room.priceWeekday)}
                </div>
              </div>
              <div>
                <div className="text-ash-600 text-[11.5px] tracking-[0.1em] uppercase">
                  {t('detail.priceWeekend')}
                </div>
                <div className="text-ash-900 mt-1.5 font-serif text-[1.4rem] leading-none">
                  {formatIDR(room.priceWeekend)}
                </div>
              </div>
            </div>
            <p className="text-ash-600 mt-3 text-[12.5px] leading-relaxed">
              {t('detail.highSeasonNote')}
            </p>

            <hr className="border-ash-200 my-5" />

            <p className="text-ash-600 text-[13.5px] leading-relaxed">
              {t('detail.contactNote')}
            </p>

            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className={actionClass('whatsapp', 'lg', 'mt-5 w-full')}
              >
                <WhatsAppGlyph />
                {t('detail.contactWa')}
              </a>
            )}
            <p className="text-ash-600 mt-3 text-center text-xs">
              {t('detail.noCharge')}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-3.5">
      <dt className="text-ash-600 flex items-center gap-2.5 text-sm">
        {icon && <span className="text-mineral-600 shrink-0">{icon}</span>}
        {label}
      </dt>
      <dd className="text-ash-900 shrink-0 font-serif text-[1.05rem]">{value}</dd>
    </div>
  );
}

function EmptyShell({
  title,
  body,
  actionLabel,
}: {
  title: string;
  body: string;
  actionLabel: string;
}) {
  return (
    <div className="container-page py-28 text-center">
      <p className="text-ash-900 font-serif text-2xl">{title}</p>
      <p className="text-ash-600 mx-auto mt-3 max-w-md text-sm leading-relaxed">
        {body}
      </p>
      <Link href="/penginapan" className={actionClass('quiet', 'md', 'mt-7')}>
        {actionLabel}
      </Link>
    </div>
  );
}

type GallerySlide =
  | { kind: 'room'; url: string }
  | { kind: 'ambience'; src: string; alt: string; objectPosition?: string };

/**
 * Galeri md ke bawah cuma satu kolom — nggak cukup lebar buat foto samping
 * berdampingan seperti di desktop, jadi diganti slider geser sendiri.
 * Menampilkan set foto SAMA PERSIS dengan grid desktop (cover + 2 lainnya,
 * fallback ambience kalau unit belum lengkap fotonya) lewat scroll-snap
 * native — bukan library carousel tambahan, konsisten dengan pola situs ini.
 */
function GalleryMobileSlider({
  cover,
  otherImages,
  ambience,
  roomName,
  photoAlt,
}: {
  cover?: PublicRoomImage;
  otherImages: PublicRoomImage[];
  ambience: SourcedImage[];
  roomName: string;
  photoAlt: (name: string) => string;
}) {
  const [active, setActive] = useState(0);

  function slotToSlide(
    own: PublicRoomImage | undefined,
    fallback: SourcedImage | undefined,
  ): GallerySlide | null {
    if (own) return { kind: 'room', url: own.url };
    if (fallback) {
      return { kind: 'ambience', src: fallback.src, alt: fallback.alt, objectPosition: fallback.objectPosition };
    }
    return null;
  }

  const slides: GallerySlide[] = [
    cover ? { kind: 'room', url: cover.url } : null,
    slotToSlide(otherImages[0], ambience[0]),
    slotToSlide(otherImages[1], ambience[1]),
  ].filter((s): s is GallerySlide => s !== null);

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  }

  if (slides.length === 0) {
    return (
      <div className="bg-ash-200 text-ash-500 relative flex h-[22rem] w-full items-center justify-center overflow-hidden rounded-2xl md:hidden">
        <Tent size={38} strokeWidth={1.25} aria-hidden />
      </div>
    );
  }

  return (
    <div className="relative md:hidden">
      <div
        onScroll={handleScroll}
        className="no-scrollbar flex h-[22rem] snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl"
      >
        {slides.map((slide, i) => (
          <figure key={i} className="relative h-full w-full shrink-0 snap-center">
            <Image
              src={slide.kind === 'room' ? resolveImageUrl(slide.url) : slide.src}
              alt={slide.kind === 'room' ? photoAlt(roomName) : slide.alt}
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover"
              style={slide.kind === 'ambience' ? { objectPosition: slide.objectPosition } : undefined}
            />
          </figure>
        ))}
      </div>
      {slides.length > 1 && (
        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={cn(
                'h-1.5 rounded-full bg-white transition-all',
                i === active ? 'w-5 opacity-100' : 'w-1.5 opacity-60',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="pb-24">
      <div className="border-ash-300/70 border-b">
        <div className="container-page pt-14 pb-12 sm:pt-20 sm:pb-16">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-6 h-3 w-24" />
          <Skeleton className="mt-4 h-11 w-3/4 max-w-lg" />
          <Skeleton className="mt-5 h-3.5 w-full max-w-xl" />
        </div>
      </div>
      <div className="container-page pt-10">
        <div className="grid h-[26rem] grid-cols-1 gap-3 md:h-[30rem] md:grid-cols-[2fr_1fr]">
          <Skeleton className="h-full rounded-2xl" />
          <div className="hidden grid-rows-2 gap-3 md:grid">
            <Skeleton className="h-full rounded-2xl" />
            <Skeleton className="h-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Lambang WhatsApp asli — sama seperti tombol mengambang, supaya kanalnya
 *  langsung dikenali dan tidak tertukar dengan tombol biasa. */
function WhatsAppGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.03s.87 2.35.99 2.51c.12.17 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
