'use client';

import { localizeRooms } from '@/lib/data/rooms';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { RoomCard } from './RoomCard';

export function ListingPage() {
  const { t, locale } = useTranslation();
  const rooms = localizeRooms(locale);

  return (
    <div className="container-page pt-14 pb-24">
      <div className="eyebrow">{t('listing.eyebrow')}</div>
      <h1 className="mt-2.5 font-serif text-3xl font-extrabold sm:text-4xl">
        {t('listing.title')}
      </h1>

      {/* Room grid */}
      <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.slug} room={room} variant="listing" t={t} />
        ))}
      </div>
    </div>
  );
}
