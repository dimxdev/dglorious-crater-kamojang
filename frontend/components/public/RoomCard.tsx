import Link from 'next/link';
import { Button, ImagePlaceholder } from '@/components/ui';
import type { RoomType } from '@/lib/data/rooms';
import { formatIDR } from '@/lib/format';

type RoomCardProps = {
  room: RoomType;
  /** 'home' = badge kapasitas + "mulai dari"; 'listing' = badge Tersedia + tag fasilitas */
  variant?: 'home' | 'listing';
  t: (key: string) => string;
};

export function RoomCard({ room, variant = 'home', t }: RoomCardProps) {
  const capLabel = `${room.capacity} tamu`;

  return (
    <div className="border-border overflow-hidden rounded-[22px] border bg-white shadow-[0_14px_34px_-24px_rgba(20,53,42,0.45)] transition-transform hover:-translate-y-1.5">
      <div className="relative h-56">
        <ImagePlaceholder icon={room.coverIcon} label={room.name} />
        {variant === 'home' ? (
          <span className="text-forest-700 absolute top-3.5 left-3.5 rounded-full bg-cream-50/95 px-3 py-1.5 text-xs font-semibold">
            👥 {capLabel}
          </span>
        ) : (
          <span className="bg-forest-700 absolute top-3.5 right-3.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-white">
            {t('listing.available')}
          </span>
        )}
      </div>

      <div className="p-5.5">
        <h3 className="font-serif text-[22px] font-semibold">{room.name}</h3>
        <p className="text-muted mt-1.5 text-sm">
          {variant === 'listing' ? `${capLabel} · ${room.tagline}` : room.tagline}
        </p>

        {variant === 'listing' && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {room.facilities.slice(0, 3).map((f) => (
              <span
                key={f.label}
                className="bg-chip text-muted-strong rounded-lg px-2.5 py-1 text-[11.5px]"
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-end justify-between">
          <div>
            {variant === 'home' && (
              <div className="text-muted text-xs">{t('home.startFrom')}</div>
            )}
            <div className="text-forest-700 font-serif text-2xl font-bold">
              {formatIDR(room.pricePerNight)}
              <span className="text-muted font-sans text-[13px] font-normal">
                {' '}
                {t('listing.perNight')}
              </span>
            </div>
          </div>
          <Link href={`/penginapan/${room.slug}`}>
            <Button size="sm">{t('listing.viewDetail')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
