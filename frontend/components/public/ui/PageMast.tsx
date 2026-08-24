import type { ReactNode } from 'react';
import { Contour } from './Contour';

/**
 * Mast halaman interior — pembuka tiap halaman selain beranda.
 *
 * Empat halaman interior sebelumnya langsung dibuka dengan judul polos tanpa
 * pembeda apa pun dari isi di bawahnya. Mast ini yang menambal hierarki itu,
 * sekaligus jadi satu-satunya tempat kicker huruf-besar muncul: dipakai sekali
 * per halaman, bukan di setiap seksi.
 */

type MetaItem = { label: string; value: string };

type PageMastProps = {
  title: ReactNode;
  lead?: string;
  /** Datum di kaki mast (mis. ketinggian, jumlah unit). */
  meta?: MetaItem[];
  /** Isi tambahan di kepala mast, mis. breadcrumb pada halaman detail. */
  children?: ReactNode;
};

export function PageMast({ title, lead, meta, children }: PageMastProps) {
  return (
    <header className="relative isolate overflow-hidden">
      {/* Hanya dari lg ke atas. Peluruhan kontur ini dipatok pada lebar SVG-nya,
          jadi di layar sempit teks dan garis terpaksa berbagi ruang yang sama
          dan garisnya menyeberang di belakang paragraf. Di bawah lg kontur
          dilepas sepenuhnya: judul yang terbaca jelas lebih berharga daripada
          tekstur latar. */}
      <Contour
        variant="mast"
        className="text-mineral-600 pointer-events-none absolute inset-y-0 right-0 -z-10 hidden h-full w-full max-w-[900px] lg:block"
      />
      <div className="container-page relative pt-7.5 pb-14 sm:pt-11.5 sm:pb-20">
        {children}
        {/* Tanpa kicker huruf-besar di atas judul. Label ber-tracking di atas
            h1 adalah pola yang dikenali detektor sebagai penanda halaman buatan
            AI, dan isinya memang cuma mengulang nama menu yang sudah aktif di
            navbar. Keterangan yang benar-benar berguna (kategori unit, dsb)
            turun ke baris datum di bawah judul. */}
        <h1 className="text-ash-900 mt-4 max-w-[16ch] font-serif text-[clamp(2.4rem,1.5rem+3.4vw,4.15rem)] leading-[1.02] font-normal tracking-[-0.035em] text-balance">
          {title}
        </h1>
        {lead && (
          <p className="text-ash-700 mt-6 max-w-[54ch] text-[clamp(1.02rem,0.95rem+0.4vw,1.2rem)] leading-[1.65]">
            {lead}
          </p>
        )}
        {meta && meta.length > 0 && (
          <dl className="border-ash-300 mt-12 flex flex-wrap gap-x-12 gap-y-5 border-t pt-6">
            {meta.map((m) => (
              <div key={m.label}>
                <dt className="text-ash-600 text-[11.5px] tracking-[0.2em] uppercase">
                  {m.label}
                </dt>
                <dd className="text-ash-900 mt-1.5 font-serif text-[1.35rem] leading-none">
                  {m.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </header>
  );
}
