import { cn } from '@/lib/cn';

/**
 * Placeholder saat data katalog masih diambil dari API.
 *
 * Bentuknya sengaja meniru tinggi kartu asli (foto 14rem + blok teks) supaya
 * begitu data datang tidak ada pergeseran tata letak — sebelumnya seluruh
 * halaman cuma menampilkan satu baris teks "Memuat…", jadi kontennya melompat
 * masuk dan mendorong halaman.
 *
 * `data-shimmer` menyalakan kilau di globals.css; seluruh aturannya dikurung
 * di `prefers-reduced-motion: no-preference`, jadi kilaunya mati sendiri tanpa
 * percabangan JSX yang bisa bikin SSR dan klien tidak sinkron.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      data-shimmer
      className={cn('bg-ash-200 rounded-lg', className)}
      aria-hidden
    />
  );
}

export function RoomCardSkeleton() {
  return (
    <div className="border-ash-300/70 overflow-hidden rounded-[22px] border bg-white">
      <Skeleton className="h-56 rounded-none" />
      <div className="p-5.5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="mt-3 h-3.5 w-full" />
        <Skeleton className="mt-2 h-3.5 w-4/5" />
        <div className="mt-6 flex items-end justify-between gap-3">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * Pengganti `PageMast` selagi konten CMS dimuat. Padding dan tinggi barisnya
 * mengikuti mast asli (judul 2 baris + paragraf pembuka) supaya isi di
 * bawahnya tidak melompat saat teksnya datang.
 */
export function MastSkeleton() {
  return (
    <header>
      <div className="container-page pt-7.5 pb-14 sm:pt-11.5 sm:pb-20" aria-hidden>
        <Skeleton className="mt-4 h-12 w-full max-w-[16ch] sm:h-16" />
        <Skeleton className="mt-3 h-12 w-2/3 max-w-[11ch] sm:h-16" />
        <Skeleton className="mt-6 h-5 w-full max-w-[54ch]" />
        <Skeleton className="mt-2.5 h-5 w-4/5 max-w-[44ch]" />
      </div>
    </header>
  );
}

/** Judul seksi + beberapa baris paragraf, untuk seksi teks yang masih dimuat. */
export function HeadingSkeleton({ lines = 0 }: { lines?: number }) {
  return (
    <div aria-hidden>
      <Skeleton className="h-10 w-full max-w-[15ch] sm:h-14" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={i === 0 ? 'mt-5 h-4 w-full max-w-[46ch]' : 'mt-2.5 h-4 w-3/4 max-w-[36ch]'}
        />
      ))}
    </div>
  );
}
