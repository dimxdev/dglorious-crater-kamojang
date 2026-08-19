'use client';

import { Tent } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PageMast, RoomCardSkeleton, actionClass } from '@/components/public/ui';
import {
  fetchPublicRoomTypes,
  type PublicRoomTypeSummary,
} from '@/lib/api/roomTypes';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { usePublicSettings, waLink } from '@/lib/usePublicSettings';
import { RoomCard } from './RoomCard';

type Status = 'loading' | 'ready' | 'error';

export function ListingPage() {
  const { t, locale } = useTranslation();
  const [rooms, setRooms] = useState<PublicRoomTypeSummary[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const { settings } = usePublicSettings();
  const waHref = waLink(
    settings?.whatsapp_number,
    'Halo D’Glorious Crater, saya ingin tanya ketersediaan tanggal dan harga penginapan.',
  );
  // Dinaikkan tombol "Coba lagi" supaya percobaan ulang lewat effect yang sama
  // dengan pemuatan pertama — satu jalur fetch, bukan dua yang bisa berbeda.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    fetchPublicRoomTypes(locale)
      .then((data) => {
        if (!active) return;
        setRooms(data);
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [locale, attempt]);

  return (
    <div className="pb-24">
      <PageMast
        title={t('listing.title')}
        lead={t('listing.lead')}
        meta={
          status === 'ready' && rooms.length > 0
            ? [
                {
                  label: t('listing.metaUnitTypes'),
                  value: String(rooms.length),
                },
                // Rentang harga di kepala halaman menjawab pertanyaan pertama
                // orang ("muat nggak di budget saya?") sebelum mereka harus
                // menggulir keenam kartu untuk mengumpulkannya sendiri.
                {
                  label: t('listing.metaRange'),
                  value: `${formatIDR(
                    Math.min(...rooms.map((r) => r.priceWeekday)),
                  )} – ${formatIDR(Math.max(...rooms.map((r) => r.priceWeekend)))}`,
                },
                {
                  label: t('listing.metaCheckIn'),
                  value: t('listing.metaCheckInValue'),
                },
              ]
            : undefined
        }
      />

      <div className="container-page pt-12">
        {/* Perubahan jumlah hasil diumumkan ke pembaca layar — tanpa ini,
            grid yang terisi setelah fetch selesai berganti tanpa suara. */}
        <p className="sr-only" role="status" aria-live="polite">
          {status === 'loading'
            ? t('common.loading')
            : status === 'error'
              ? t('common.loadError')
              : t('listing.resultCount', { count: rooms.length })}
        </p>

        {status === 'loading' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        )}

        {status === 'error' && (
          <div className="border-ash-300 mx-auto max-w-md rounded-2xl border border-dashed px-6 py-14 text-center">
            <p className="text-ash-800 font-medium">{t('common.loadError')}</p>
            <p className="text-ash-600 mt-1.5 text-sm">{t('listing.errorHint')}</p>
            <button
              type="button"
              onClick={() => setAttempt((n) => n + 1)}
              className={actionClass('quiet', 'md', 'mt-6')}
            >
              {t('common.retry')}
            </button>
          </div>
        )}

        {status === 'ready' && rooms.length === 0 && (
          <div className="border-ash-300 mx-auto max-w-md rounded-2xl border border-dashed px-6 py-14 text-center">
            <Tent
              size={26}
              strokeWidth={1.25}
              className="text-ash-500 mx-auto"
              aria-hidden
            />
            <p className="text-ash-800 mt-4 font-medium">{t('listing.empty')}</p>
            <p className="text-ash-600 mt-1.5 text-sm">{t('listing.emptyHint')}</p>
          </div>
        )}

        {status === 'ready' && rooms.length > 0 && (
          <>
            <h2 className="sr-only">{t('listing.gridHeading')}</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <RoomCard key={room.slug} room={room} variant="listing" t={t} />
              ))}
            </div>

            {/* Halaman ini sebelumnya berhenti begitu saja setelah kartu
                terakhir. Orang yang sudah menggulir sampai bawah adalah orang
                yang paling siap memesan — membiarkan mereka menemukan sendiri
                cara menghubungi kami adalah gesekan yang tidak perlu. */}
            <div className="border-ash-300 mt-16 flex flex-wrap items-end justify-between gap-x-10 gap-y-6 border-t pt-10">
              <div>
                <h2 className="text-ash-900 max-w-[18ch] font-serif text-[clamp(1.5rem,1.2rem+1.2vw,2.2rem)] leading-[1.1] tracking-[-0.03em]">
                  {t('listing.helpTitle')}
                </h2>
                <p className="text-ash-600 mt-3 max-w-[46ch] text-sm leading-relaxed">
                  {t('listing.helpBody')}
                </p>
              </div>
              {waHref && (
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={actionClass('primary', 'lg')}
                >
                  {t('nav.reserve')}
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
