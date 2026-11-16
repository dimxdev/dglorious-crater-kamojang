'use client';

import { useEffect, useRef, useState } from 'react';
import { HeadingSkeleton, Contour, Skeleton } from '@/components/public/ui';
import { pickL } from '@/lib/api/siteContent';
import { resolveIcon } from '@/lib/icons';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { useSiteContent } from '@/lib/useSiteContent';
import { cn } from '@/lib/cn';

/**
 * Indeks fasilitas kawasan.
 *
 * Daftar aslinya di spanduk berurutan alfabetis, dan urutan itu menyembunyikan
 * hal paling menarik dari tempat ini: ada empat kawah bernama, empat cara
 * berendam, dan tiga jembatan. Dikelompokkan, angkanya sendiri yang bercerita —
 * jadi angka itu yang dibesarkan, bukan ikon hiasan.
 *
 * Sengaja TIDAK memakai filter yang menyembunyikan item. Daftar fasilitas itu
 * dipindai orang untuk mencari satu hal tertentu ("ada mushola nggak?");
 * menyembunyikan sebagian demi animasi justru membuatnya lebih sulit dipakai.
 * Interaksinya menajamkan fokus, bukan memotong isi.
 */
export function KawasanIndex() {
  const { locale } = useTranslation();
  const { content, failed } = useSiteContent();
  const [active, setActive] = useState<number | null>(null);
  const { ref, shown } = useDrawOnEnter<HTMLElement>();

  // Gagal memuat: seksi ini disembunyikan, halaman induk sudah menampilkan
  // pesan galatnya sendiri.
  if (failed) return null;

  const section = content?.sections.facilities;
  const zones = (content?.collections.FACILITY_ZONE ?? []).map((z) => ({
    id: z.id,
    icon: z.content.icon,
    name: pickL(z.content.name, locale),
    note: pickL(z.content.note, locale),
    items: z.content.items.map((i) => pickL(i, locale)).filter(Boolean),
  }));
  const total = zones.reduce((sum, z) => sum + z.items.length, 0);

  return (
    <section
      ref={ref}
      id="fasilitas"
      className="relative isolate scroll-mt-24 overflow-hidden py-24"
    >
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-4">
          {section ? (
            <h2 className="text-ash-900 max-w-[13ch] font-serif text-[clamp(2rem,1.35rem+2.6vw,3.4rem)] leading-[1.04] tracking-[-0.035em] text-balance">
              {pickL(section.title, locale)}
            </h2>
          ) : (
            <HeadingSkeleton />
          )}
          {section && (
            <p className="text-ash-600 max-w-[34ch] text-sm leading-relaxed">
              {/* Token {count} opsional: kalau admin menaruhnya di catatan,
                  diisi jumlah butir yang benar-benar ada. */}
              {pickL(section.note, locale).replace('{count}', String(total))}
            </p>
          )}
        </div>

        {/* Kontur dikurung di sini, di belakang DAFTAR saja — bukan sepanjang
            seksi. Ditaruh sepanjang seksi, garisnya menyeberang di belakang
            paragraf pengantar dan teksnya jadi susah dibaca. Chip-chip di
            daftar punya latar sendiri, jadi aman dilewati garis. */}
        <div className="relative isolate mt-14">
          <Contour
            variant="band"
            data-draw={shown ? 'shown' : undefined}
            className="text-mineral-600/35 pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 w-full sm:h-80"
          />
          <dl
            className="border-ash-300 border-t"
            onMouseLeave={() => setActive(null)}
          >
            {!content &&
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  aria-hidden
                  className="border-ash-300 grid gap-x-8 gap-y-4 border-b py-8 md:grid-cols-[5.5rem_14rem_1fr]"
                >
                  <Skeleton className="h-10 w-14" />
                  <div>
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="mt-3 h-3.5 w-full" />
                  </div>
                  <Skeleton className="h-8 w-full max-w-md" />
                </div>
              ))}
            {zones.map((z) => {
              const Icon = resolveIcon(z.icon);
              const dimmed = active !== null && active !== z.id;
              return (
                <div
                  key={z.id}
                  onMouseEnter={() => setActive(z.id)}
                  onFocus={() => setActive(z.id)}
                  onBlur={() => setActive(null)}
                  tabIndex={0}
                  className={cn(
                    'border-ash-300 focus-visible:ring-mineral-500 grid gap-x-8 gap-y-4 border-b py-8 transition-opacity duration-300 outline-none focus-visible:ring-2 md:grid-cols-[5.5rem_14rem_1fr]',
                    dimmed ? 'opacity-45' : 'opacity-100',
                  )}
                >
                  {/* Angka, bukan ikon, yang dibesarkan: jumlahnya memang
                    keterangan yang paling berguna di sini. */}
                  <dt className="flex items-baseline gap-3 md:block">
                    <span
                      className={cn(
                        'font-serif text-[2.6rem] leading-none tabular-nums transition-colors duration-300',
                        active === z.id ? 'text-mineral-600' : 'text-ash-300',
                      )}
                    >
                      {String(z.items.length).padStart(2, '0')}
                    </span>
                    <span className="sr-only">{z.name}</span>
                  </dt>

                  <div className="md:pt-1.5">
                    <div className="flex items-center gap-2.5">
                      <Icon
                        size={16}
                        strokeWidth={1.5}
                        className="text-mineral-600 shrink-0"
                        aria-hidden
                      />
                      <span
                        aria-hidden
                        className="text-ash-900 font-serif text-[1.3rem] leading-none"
                      >
                        {z.name}
                      </span>
                    </div>
                    <p className="text-ash-600 mt-2.5 text-[13px] leading-relaxed">
                      {z.note}
                    </p>
                  </div>

                  <dd
                    className={cn(
                      'flex flex-wrap items-start gap-x-2.5 gap-y-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:pt-2',
                      active === z.id ? 'md:translate-x-1.5' : '',
                    )}
                  >
                    {z.items.map((item, i) => (
                      <span
                        key={i}
                        className={cn(
                          'rounded-full px-3 py-1.5 text-[13px] transition-colors duration-300',
                          active === z.id
                            ? 'bg-mineral-50 text-mineral-800'
                            : 'bg-ash-200/70 text-ash-700',
                        )}
                      >
                        {item}
                      </span>
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        {/* Kejujuran soal apa yang TIDAK bisa dijanjikan halaman ini. */}
        {section && (
          <p className="text-ash-600 mt-8 max-w-[52ch] text-[12.5px] leading-relaxed">
            {pickL(section.disclaimer, locale)}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * Menyalakan `data-draw` sekali saat elemen masuk layar.
 *
 * IntersectionObserver, bukan pendengar scroll: browser yang menghitung
 * perpotongannya, jadi tidak ada kerja per frame di thread utama. Sekali jalan
 * lalu berhenti mengamati — garis kontur ini tidak perlu digambar ulang tiap
 * kali pengguna menggulir balik.
 */
function useDrawOnEnter<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Kalau browser tidak punya IntersectionObserver, tampilkan saja langsung
    // daripada menyembunyikan konten selamanya.
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: '-12% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, shown };
}
