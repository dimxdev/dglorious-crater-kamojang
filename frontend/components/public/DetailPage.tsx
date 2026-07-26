'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BedDouble, Info, MessageCircle, Users } from 'lucide-react';
import { getImage } from '@/lib/data/images';
import { localizeRoom, type RoomSource } from '@/lib/data/rooms';
import { getSettings } from '@/lib/data/settings';
import { formatIDR } from '@/lib/format';
import { getIcon } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';

// Fase 1: belum ada booking online, jadi CTA mengarah ke WhatsApp reservasi
// (bukan form booking). Nomor diambil dari tabel `settings` (§8.3), sama
// dengan yang dipakai FloatingWhatsApp.

export function DetailPage({ room: source }: { room: RoomSource }) {
  const { t, locale } = useTranslation();
  const room = localizeRoom(source, locale);
  const { waNumber } = getSettings(locale);
  const cover = getImage(room.photo);
  // Dua tenda berbagi foto sampul sementara (belum ada foto asli per unit),
  // jadi thumbnail ambience dipinjam dari foto umum lokasi/atraksi — bukan
  // dari tenda lain, supaya tidak terkesan menampilkan unit yang salah.
  const ambience1 = getImage('attractionAirPanas');
  const ambience2 = getImage('locationValley');

  const waHref = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    `Halo D'Glorious Crater, saya ingin tanya ketersediaan & booking untuk ${room.name}.`,
  )}`;

  return (
    <div className="container-page pt-8 pb-24">
      {/* Breadcrumb */}
      <div className="text-muted text-[13px]">
        <Link href="/penginapan">{t('nav.lodging')}</Link> /{' '}
        <span className="text-foreground">{room.name}</span>
      </div>

      {/* Gallery */}
      <div className="mt-4 grid h-110 grid-cols-1 gap-3.5 md:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-xl">
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            priority
            className="object-cover"
            style={{ objectPosition: cover.objectPosition }}
          />
        </div>
        <div className="hidden grid-rows-2 gap-3.5 md:grid">
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src={ambience1.src}
              alt={ambience1.alt}
              fill
              sizes="30vw"
              className="object-cover"
              style={{ objectPosition: ambience1.objectPosition }}
            />
          </div>
          <div className="relative overflow-hidden rounded-xl">
            <Image
              src={ambience2.src}
              alt={ambience2.alt}
              fill
              sizes="30vw"
              className="object-cover"
              style={{ objectPosition: ambience2.objectPosition }}
            />
          </div>
        </div>
      </div>

      {/* Body + kartu kontak */}
      <div className="mt-11 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          <span className="bg-chip text-muted-strong inline-block rounded-full px-2.5 py-0.5 text-xs font-medium">
            {room.category}
          </span>
          <h1 className="mt-2.5 font-serif text-3xl font-extrabold sm:text-4xl">
            {room.name}
          </h1>
          <div className="text-muted mt-2 text-[15px]">
            👥 {t('detail.capacity')}{' '}
            {t('common.guestsCount', { count: room.capacity })} · {room.bedInfo}
          </div>
          <p className="text-muted-strong mt-6 text-base leading-8">
            {room.description}
          </p>

          {/* Kapasitas & Extra Bed */}
          <h2 className="mt-9 font-serif text-2xl font-bold">
            {t('detail.capacityTitle')}
          </h2>
          <div className="border-border mt-4 grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <span className="bg-chip text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <Users size={20} strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <div className="text-muted text-xs">
                  {t('detail.baseCapacity')}
                </div>
                <div className="mt-0.5 font-serif text-xl font-semibold">
                  {t('common.guestsCount', { count: room.capacity })}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="bg-chip text-accent flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
                <BedDouble size={20} strokeWidth={1.5} aria-hidden />
              </span>
              <div>
                <div className="text-muted text-xs">{t('detail.bedInfo')}</div>
                <div className="mt-0.5 font-serif text-lg font-semibold">
                  {room.bedInfo}
                </div>
              </div>
            </div>

            {/* Tarif tambah orang — beda struktur utk Campervan (flat) vs unit lain (bed/tanpa-bed) */}
            <div className="sm:col-span-2">
              <div className="text-muted-strong mb-2 text-sm font-medium">
                {t('detail.extraGuestTitle')}
              </div>
              {room.extraFlatPrice !== undefined ? (
                <div className="border-border flex items-center justify-between rounded-xl border border-dashed bg-[#faf8f4] px-4 py-3">
                  <span className="text-muted-strong text-sm">
                    {t('detail.extraFlatLabel')}
                  </span>
                  <span className="text-forest-700 font-serif text-lg font-bold">
                    {formatIDR(room.extraFlatPrice)}
                  </span>
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="border-border flex items-center justify-between rounded-xl border border-dashed bg-[#faf8f4] px-4 py-3">
                    <span className="text-muted-strong text-sm">
                      {t('detail.withBed')}
                    </span>
                    <span className="text-forest-700 font-serif text-base font-bold">
                      {formatIDR(room.extraBedPrice ?? 0)}
                    </span>
                  </div>
                  <div className="border-border flex items-center justify-between rounded-xl border border-dashed bg-[#faf8f4] px-4 py-3">
                    <span className="text-muted-strong text-sm">
                      {t('detail.withoutBed')}
                    </span>
                    <span className="text-forest-700 font-serif text-base font-bold">
                      {formatIDR(room.extraNoBedPrice ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Catatan aturan anak */}
          <div className="border-accent/25 bg-accent/5 mt-3.5 flex gap-2.5 rounded-xl border p-4">
            <Info
              size={17}
              strokeWidth={1.5}
              className="text-accent mt-0.5 shrink-0"
              aria-hidden
            />
            <div>
              <div className="text-[13.5px] font-semibold">
                {t('detail.childrenRuleTitle')}
              </div>
              <p className="text-muted-strong mt-1 text-[13px] leading-relaxed">
                {t('detail.childrenRule')}
              </p>
            </div>
          </div>

          {/* Fasilitas */}
          <h2 className="mt-9 font-serif text-2xl font-bold">
            {t('detail.facilities')}
          </h2>
          <div className="text-muted mt-1 text-[13px]">{room.bathroomInfo}</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {room.facilities.map((f) => {
              const Icon = getIcon(f.icon);
              return (
                <div
                  key={f.label}
                  className="text-muted-strong flex items-center gap-2.5 text-[14.5px]"
                >
                  <Icon
                    size={17}
                    strokeWidth={1.5}
                    className="text-accent shrink-0"
                    aria-hidden
                  />
                  {f.label}
                </div>
              );
            })}
          </div>
          <p className="text-muted mt-4 text-[13px]">
            {t('detail.universalFacilitiesNote')}{' '}
            <Link href="/tentang#fasilitas" className="text-accent font-medium">
              {t('detail.universalFacilitiesLink')}
            </Link>
          </p>

          {/* Jam */}
          <div className="mt-9 flex flex-wrap gap-10">
            <div>
              <div className="text-muted text-xs">{t('detail.checkIn')}</div>
              <div className="mt-0.5 font-semibold">{room.checkInTime}</div>
            </div>
            <div>
              <div className="text-muted text-xs">{t('detail.checkOut')}</div>
              <div className="mt-0.5 font-semibold">{room.checkOutTime}</div>
            </div>
          </div>

          {/* Aturan */}
          <h2 className="mt-9 font-serif text-2xl font-bold">
            {t('detail.rules')}
          </h2>
          <ul className="text-muted-strong mt-3.5 list-disc pl-5 text-[14.5px] leading-8">
            {room.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        {/* Kartu harga + kontak WhatsApp */}
        <div className="self-start">
          <div className="border-border rounded-[22px] border bg-white p-6 shadow-[0_20px_44px_-26px_rgba(20,53,42,0.5)]">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-muted text-[11px]">
                  {t('detail.priceWeekday')}
                </div>
                <div className="text-forest-700 font-serif text-xl font-extrabold">
                  {formatIDR(room.priceWeekday)}
                </div>
              </div>
              <div>
                <div className="text-muted text-[11px]">
                  {t('detail.priceWeekend')}
                </div>
                <div className="text-forest-700 font-serif text-xl font-extrabold">
                  {formatIDR(room.priceWeekend)}
                </div>
              </div>
            </div>
            <div className="text-muted mt-2 text-[11.5px] italic">
              {t('detail.highSeasonNote')}
            </div>

            <p className="text-muted mt-4 text-[13.5px] leading-relaxed">
              {t('detail.contactNote')}
            </p>

            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              <MessageCircle size={18} strokeWidth={1.5} aria-hidden />
              {t('detail.contactWa')}
            </a>
            <div className="text-muted mt-2.5 text-center text-xs">
              {t('detail.noCharge')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
