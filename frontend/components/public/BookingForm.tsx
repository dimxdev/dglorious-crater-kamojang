'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, ImagePlaceholder, Input, Select } from '@/components/ui';
import { getRoomBySlug, rooms } from '@/lib/data/rooms';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { PaymentModal } from './PaymentModal';

const NIGHTS = 2;

export function BookingForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const room = getRoomBySlug(searchParams.get('room') ?? '') ?? rooms[0];
  const [paymentOpen, setPaymentOpen] = useState(false);

  const subtotal = room.pricePerNight * NIGHTS;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const guestOptions = [
    { value: '1', label: '1 tamu' },
    { value: '2', label: '2 tamu' },
    { value: '4', label: '4 tamu' },
  ];

  return (
    <div className="mx-auto max-w-[1080px] px-7 pt-12 pb-24">
      {/* Breadcrumb */}
      <div className="text-muted text-[13px]">
        <Link href="/penginapan">{t('nav.lodging')}</Link> /{' '}
        <Link href={`/penginapan/${room.slug}`}>{room.name}</Link> /{' '}
        <span className="text-foreground">Booking</span>
      </div>
      <h1 className="mt-2.5 font-serif text-3xl font-extrabold sm:text-4xl">
        {t('booking.title')}
      </h1>
      <div className="text-muted mt-1.5 text-sm">{t('booking.subtitle')}</div>

      <div className="mt-8 grid gap-9 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <div className="border-border rounded-[20px] border bg-white p-7">
          <div className="grid gap-4.5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input label={`${t('booking.name')} *`} name="name" defaultValue="Andini Rahmawati" />
            </div>
            <Input label={`${t('booking.phone')} *`} name="phone" defaultValue="0812-3456-7890" />
            <Input label={`${t('booking.email')} *`} name="email" type="email" defaultValue="andini@email.com" />
            <Input label={t('booking.checkIn')} name="checkIn" type="date" defaultValue="2026-07-20" />
            <Input label={t('booking.checkOut')} name="checkOut" type="date" defaultValue="2026-07-22" />
            <div className="sm:col-span-2">
              <Select label={t('booking.guests')} name="guests" defaultValue="2" options={guestOptions} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="notes" className="text-foreground text-sm font-medium">
                {t('booking.notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder={t('booking.notesPlaceholder')}
                className="border-input focus:border-forest-500 focus:ring-forest-500/20 resize-none rounded-[10px] border bg-white px-3.5 py-2.5 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
          </div>
          <div className="text-muted mt-4.5 rounded-[10px] bg-[#f6f2e8] px-3.5 py-3 text-[12.5px]">
            📧 {t('booking.emailNote')}
          </div>
        </div>

        {/* Summary */}
        <div className="border-border self-start overflow-hidden rounded-[20px] border bg-white shadow-[0_20px_44px_-26px_rgba(20,53,42,0.5)] lg:sticky lg:top-24">
          <div className="relative h-[150px]">
            <ImagePlaceholder icon={room.coverIcon} label={room.name} />
          </div>
          <div className="p-5.5">
            <div className="text-accent text-xs font-semibold tracking-[0.14em] uppercase">
              {t('booking.summary')}
            </div>
            <div className="mt-2 font-serif text-xl font-semibold">{room.name}</div>
            <div className="text-muted mt-1 text-[13px]">20 – 22 Jul 2026 · 2 tamu</div>
            <div className="mt-4 border-t border-dashed border-[#e2dccb] pt-3.5 text-sm">
              <div className="text-muted-strong mb-2 flex justify-between">
                <span>
                  {formatIDR(room.pricePerNight)} × {NIGHTS} {t('common.night')}
                </span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              <div className="text-muted-strong mb-3 flex justify-between">
                <span>{t('booking.tax')}</span>
                <span>{formatIDR(tax)}</span>
              </div>
              <div className="flex justify-between text-[17px] font-bold">
                <span>{t('detail.total')}</span>
                <span className="text-forest-700">{formatIDR(total)}</span>
              </div>
            </div>
            <Button
              variant="secondary"
              fullWidth
              className="mt-4.5 rounded-xl"
              onClick={() => setPaymentOpen(true)}
            >
              {t('booking.continue')}
            </Button>
          </div>
        </div>
      </div>

      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={total}
        orderId="DGC-48213"
      />
    </div>
  );
}
