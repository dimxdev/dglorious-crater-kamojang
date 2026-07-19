'use client';

import Link from 'next/link';
import { Button, ImagePlaceholder, Select } from '@/components/ui';
import type { RoomType } from '@/lib/data/rooms';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { BookingCalendar } from './BookingCalendar';

const NIGHTS = 2;

export function DetailPage({ room }: { room: RoomType }) {
  const { t } = useTranslation();
  const subtotal = room.pricePerNight * NIGHTS;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  return (
    <div className="container-page pt-8 pb-24">
      {/* Breadcrumb */}
      <div className="text-muted text-[13px]">
        <Link href="/penginapan">{t('nav.lodging')}</Link>{' '}
        / <span className="text-foreground">{room.name}</span>
      </div>

      {/* Gallery */}
      <div className="mt-4 grid h-[440px] grid-cols-1 gap-3.5 md:grid-cols-[2fr_1fr]">
        <div className="relative overflow-hidden rounded-[20px]">
          <ImagePlaceholder icon={room.coverIcon} label="Foto cover" />
        </div>
        <div className="hidden grid-rows-2 gap-3.5 md:grid">
          <div className="relative overflow-hidden rounded-[20px]">
            <ImagePlaceholder icon="📷" label="Foto interior" />
          </div>
          <div className="relative overflow-hidden rounded-[20px]">
            <ImagePlaceholder icon="📷" label="Foto sekitar" />
          </div>
        </div>
      </div>

      {/* Body + sticky widget */}
      <div className="mt-11 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div>
          <h1 className="font-serif text-3xl font-extrabold sm:text-4xl">
            {room.name}
          </h1>
          <div className="text-muted mt-2 text-[15px]">
            👥 {t('detail.capacity')} {room.capacity} tamu · ♨️ {t('detail.hotBath')}
          </div>
          <p className="text-muted-strong mt-6 text-base leading-8">
            {room.description}
          </p>

          {/* Fasilitas */}
          <h2 className="mt-9 font-serif text-2xl font-bold">
            {t('detail.facilities')}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {room.facilities.map((f) => (
              <div
                key={f.label}
                className="text-muted-strong flex items-center gap-2.5 text-[14.5px]"
              >
                <span className="text-accent font-bold">✓</span>
                {f.icon} {f.label}
              </div>
            ))}
          </div>

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
          <h2 className="mt-9 font-serif text-2xl font-bold">{t('detail.rules')}</h2>
          <ul className="text-muted-strong mt-3.5 list-disc pl-5 text-[14.5px] leading-8">
            {room.rules.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>

        {/* Sticky booking widget */}
        <div className="self-start lg:sticky lg:top-24">
          <div className="border-border rounded-[22px] border bg-white p-6 shadow-[0_20px_44px_-26px_rgba(20,53,42,0.5)]">
            <div className="flex items-baseline gap-1.5">
              <span className="text-forest-700 font-serif text-[28px] font-extrabold">
                {formatIDR(room.pricePerNight)}
              </span>
              <span className="text-muted text-[13px]">{t('common.perNight')}</span>
            </div>

            <div className="mt-4">
              <BookingCalendar />
            </div>

            <div className="mt-4">
              <Select
                label={t('detail.guests')}
                name="guests"
                defaultValue="2"
                options={[
                  { value: '1', label: '1 tamu' },
                  { value: '2', label: '2 tamu' },
                  { value: '4', label: '4 tamu' },
                ]}
              />
            </div>

            {/* Ringkasan harga */}
            <div className="mt-4.5 border-t border-dashed border-[#e2dccb] pt-4 text-sm">
              <div className="text-muted-strong mb-2 flex justify-between">
                <span>
                  {formatIDR(room.pricePerNight)} × {NIGHTS} {t('common.night')}
                </span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              <div className="text-muted-strong mb-3 flex justify-between">
                <span>{t('detail.tax')}</span>
                <span>{formatIDR(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold">
                <span>{t('detail.total')}</span>
                <span className="text-forest-700">{formatIDR(total)}</span>
              </div>
            </div>

            <Link href={`/booking?room=${room.slug}`} className="mt-4.5 block">
              <Button variant="secondary" fullWidth className="rounded-xl">
                {t('detail.bookNow')}
              </Button>
            </Link>
            <div className="text-muted mt-2.5 text-center text-xs">
              {t('detail.noCharge')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
