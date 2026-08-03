'use client';

import { useEffect, useState } from 'react';
import { fetchPublicRoomTypes, type PublicRoomTypeSummary } from '@/lib/api/roomTypes';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { RoomCard } from './RoomCard';

export function ListingPage() {
  const { t, locale } = useTranslation();
  const [rooms, setRooms] = useState<PublicRoomTypeSummary[] | null>(null);

  useEffect(() => {
    setRooms(null);
    fetchPublicRoomTypes(locale)
      .then(setRooms)
      .catch(() => setRooms([]));
  }, [locale]);

  return (
    <div className="container-page pt-14 pb-24">
      <div className="eyebrow">{t('listing.eyebrow')}</div>
      <h1 className="mt-2.5 font-serif text-3xl font-extrabold sm:text-4xl">
        {t('listing.title')}
      </h1>

      {/* Room grid */}
      {rooms === null ? (
        <p className="text-muted mt-9 text-sm">{t('common.loading')}</p>
      ) : (
        <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.slug} room={room} variant="listing" t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
