import { Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { getImage } from '@/lib/data/images';
import type { RoomType } from '@/lib/data/rooms';
import { formatIDR } from '@/lib/format';
import { getIcon } from '@/lib/icons';

type RoomCardProps = {
  room: RoomType;
  /** 'home' = badge kapasitas + "mulai dari"; 'listing' = badge Tersedia + tag fasilitas */
  variant?: 'home' | 'listing';
  t: (key: string, params?: Record<string, string | number>) => string;
};

export function RoomCard({ room, variant = 'home', t }: RoomCardProps) {
  const capLabel = t('common.guestsCount', { count: room.capacity });
  const photo = getImage(room.photo);

  return (
    <div className="group border-border overflow-hidden rounded-[22px] border bg-white shadow-[0_14px_34px_-26px_rgba(23,20,15,0.45)] transition-shadow duration-500 hover:shadow-[0_22px_44px_-26px_rgba(23,20,15,0.5)]">
      <div className="relative h-56 overflow-hidden">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
          style={{ objectPosition: photo.objectPosition }}
        />
        {variant === 'home' ? (
          <span className="text-basalt-800 absolute top-3.5 left-3.5 flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold">
            <Users size={13} strokeWidth={1.5} aria-hidden />
            {capLabel}
          </span>
        ) : (
          <span className="bg-basalt-800 absolute top-3.5 right-3.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-white">
            {t('listing.available')}
          </span>
        )}
      </div>

      <div className="p-5.5">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-[22px] font-semibold">{room.name}</h3>
          <span className="bg-chip text-muted-strong rounded-full px-2 py-0.5 text-[10.5px] font-medium">
            {room.category}
          </span>
        </div>
        <p className="text-muted mt-1.5 text-sm">
          {variant === 'listing'
            ? `${capLabel} · ${room.tagline}`
            : room.tagline}
        </p>

        {variant === 'listing' && (
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {room.facilities.slice(0, 3).map((f) => {
              const Icon = getIcon(f.icon);
              return (
                <span
                  key={f.label}
                  className="bg-chip text-muted-strong flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11.5px]"
                >
                  <Icon size={12} strokeWidth={1.5} aria-hidden />
                  {f.label}
                </span>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex flex-nowrap items-center justify-between gap-3">
          <div className="min-w-0">
            {variant === 'home' && (
              <div className="text-muted text-xs">{t('home.startFrom')}</div>
            )}
            <div className="text-basalt-900 font-serif text-xl leading-tight font-semibold whitespace-nowrap">
              {formatIDR(room.priceWeekday)}
            </div>
            <div className="text-muted mt-0.5 text-[12px] whitespace-nowrap">
              {t('listing.perNight')}
            </div>
          </div>
          <Link href={`/penginapan/${room.slug}`} className="shrink-0">
            <Button size="sm">{t('listing.viewDetail')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
