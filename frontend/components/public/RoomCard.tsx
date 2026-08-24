import { ChevronRight, Tent, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { PublicRoomTypeSummary } from '@/lib/api/roomTypes';
import { resolveImageUrl } from '@/lib/api/roomTypes';
import { formatIDR } from '@/lib/format';
import { getIcon, type IconName } from '@/lib/icons';

type RoomCardProps = {
  room: PublicRoomTypeSummary;
  /** 'home' = ringkas; 'listing' = tambah baris fasilitas untuk dibandingkan. */
  variant?: 'home' | 'listing';
  t: (key: string, params?: Record<string, string | number>) => string;
};

/**
 * Kartu unit penginapan.
 *
 * Dua keputusan yang mengubah isinya:
 *
 * 1. HARGA WEEKEND IKUT DITAMPILKAN. Datanya (`priceWeekend`) sudah dikirim
 *    API sejak awal tapi tidak pernah dipakai — kartu lama cuma menulis
 *    "mulai dari" harga weekday. Padahal orang merencanakan menginap di akhir
 *    pekan, jadi harga yang mereka lihat di situs bukan harga yang mereka
 *    bayar, dan selisihnya baru ketahuan saat chat. Itu bukan cuma soal
 *    transparansi: kejutan harga di tengah percakapan adalah tempat calon
 *    tamu paling sering mundur.
 *
 * 2. TAGLINE JADI PEMBEDA UTAMA, bukan keterangan kecil. Enam unit di sini
 *    perlu dibandingkan cepat, dan yang membedakannya justru ada di tagline
 *    ("kolam air panas sendiri", "menghadap lembah") — bukan di namanya.
 *
 * Seluruh kartu tetap satu tautan: sasaran kliknya sebesar kartunya, dan
 * pembaca layar mendengar satu tautan bernama unit itu, bukan deretan
 * "Lihat Detail" yang semuanya berbunyi sama.
 */
export function RoomCard({ room, variant = 'home', t }: RoomCardProps) {
  const capLabel = t('common.guestsCount', { count: room.capacity });
  const sameRate = room.priceWeekend === room.priceWeekday;

  return (
    <Link
      href={`/penginapan/${room.slug}`}
      className="group border-ash-300/70 focus-visible:ring-mineral-500 focus-visible:ring-offset-ash-100 hover:border-ash-400/80 flex flex-col overflow-hidden rounded-[22px] border bg-white transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="relative h-52 overflow-hidden">
        {room.coverImageUrl ? (
          <Image
            src={resolveImageUrl(room.coverImageUrl)}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="bg-ash-200 text-ash-500 flex h-full w-full items-center justify-center">
            <Tent size={30} strokeWidth={1.25} aria-hidden />
          </div>
        )}
        <span className="text-ash-800 absolute top-3.5 left-3.5 rounded-full bg-white/95 px-3 py-1.5 text-[11.5px] font-semibold tracking-[0.08em] uppercase">
          {room.category}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5.5">
        <h3 className="text-ash-900 font-serif text-[1.4rem] leading-tight">
          {room.name}
        </h3>
        {room.tagline && (
          <p className="text-ash-700 mt-2 text-[15px] leading-snug">
            {room.tagline}
          </p>
        )}

        {/* Baris spesifikasi — dipindai, bukan dibaca. Kapasitas selalu di
            depan karena itu penyaring pertama: rombongan berapa orang. */}
        <div className="text-ash-600 mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[12.5px]">
          <span className="text-ash-800 flex items-center gap-1.5 font-medium">
            <Users size={13} strokeWidth={1.75} aria-hidden />
            {capLabel}
          </span>
          {room.facilities.slice(0, variant === 'listing' ? 3 : 2).map((f) => {
            const Icon = getIcon(f.icon as IconName);
            return (
              <span key={f.label} className="flex items-center gap-1.5">
                <span className="text-ash-400" aria-hidden>
                  ·
                </span>
                <Icon size={12} strokeWidth={1.5} aria-hidden />
                {f.label}
              </span>
            );
          })}
        </div>

        {/* Dua tarif berdampingan. Kalau nilainya sama, satu kolom saja —
            dua kolom identik cuma bikin orang mengira ada yang salah baca. */}
        <div className="border-ash-200 mt-auto flex items-end justify-between gap-2 border-t pt-4.5 sm:gap-4">
          <dl className="flex min-w-0 gap-4 sm:gap-6">
            <div>
              <dt className="text-ash-600 text-[11.5px] tracking-[0.12em] uppercase">
                {sameRate ? t('listing.rateAllDays') : t('listing.rateWeekday')}
              </dt>
              <dd className="text-ash-900 mt-1 font-serif text-[1.25rem] leading-none whitespace-nowrap">
                {formatIDR(room.priceWeekday)}
              </dd>
            </div>
            {!sameRate && (
              <div>
                <dt className="text-ash-600 text-[11.5px] tracking-[0.12em] uppercase">
                  {t('listing.rateWeekend')}
                </dt>
                <dd className="text-ash-800 mt-1 font-serif text-[1.25rem] leading-none whitespace-nowrap">
                  {formatIDR(room.priceWeekend)}
                </dd>
              </div>
            )}
          </dl>
          {/* Penanda visual, bukan tombol — seluruh kartunya sudah tautan,
              jadi ini tidak boleh bisa difokus sendiri. Lebar kartu di grid
              3 kolom desktop (~378px) nggak jauh beda dari 1 kolom mobile,
              jadi lingkaran 44px lama bisa nyempil di DUA-DUANYA begitu
              harga cukup panjang — bukan cuma soal breakpoint layar, tapi
              soal lebar kartu itu sendiri. Diganti chevron kecil tanpa
              latar di semua ukuran, biar konsisten hemat ruang & tahan
              kalau nanti ada tarif dengan lebih banyak digit. */}
          <span
            aria-hidden
            className="text-mineral-700 flex h-6 w-6 shrink-0 items-center justify-center"
          >
            <ChevronRight size={18} strokeWidth={2} />
          </span>
        </div>
        <p className="text-ash-600 mt-2 text-[11.5px]">{t('listing.perNight')}</p>
      </div>
    </Link>
  );
}
