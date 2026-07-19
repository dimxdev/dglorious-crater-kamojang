'use client';

import { Button, DatePicker, Select } from '@/components/ui';
import { rooms } from '@/lib/data/rooms';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { RoomCard } from './RoomCard';

const guestOptions = [
  { value: '1', label: '1 tamu' },
  { value: '2', label: '2 tamu' },
  { value: '4', label: '4 tamu' },
  { value: '6', label: '6 tamu' },
];

export function ListingPage() {
  const { t } = useTranslation();

  return (
    <div className="container-page pt-14 pb-24">
      <div className="eyebrow">{t('listing.eyebrow')}</div>
      <h1 className="mt-2.5 font-serif text-3xl font-extrabold sm:text-5xl">
        {t('listing.title')}
      </h1>

      {/* Filter bar */}
      <div className="border-border mt-7 flex flex-wrap items-end gap-4 rounded-[18px] border bg-white p-5 shadow-[0_10px_30px_-22px_rgba(20,53,42,0.4)]">
        <div className="min-w-[150px] flex-1">
          <DatePicker
            label={t('listing.checkIn')}
            name="checkIn"
            defaultValue="2026-07-20"
          />
        </div>
        <div className="min-w-[150px] flex-1">
          <DatePicker
            label={t('listing.checkOut')}
            name="checkOut"
            defaultValue="2026-07-22"
          />
        </div>
        <div className="min-w-[130px] flex-1">
          <Select
            label={t('listing.guests')}
            name="guests"
            defaultValue="2"
            options={guestOptions}
          />
        </div>
        <Button variant="secondary" className="rounded-[10px]">
          {t('listing.search')}
        </Button>
      </div>

      {/* Room grid */}
      <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.slug} room={room} variant="listing" t={t} />
        ))}
      </div>
    </div>
  );
}
