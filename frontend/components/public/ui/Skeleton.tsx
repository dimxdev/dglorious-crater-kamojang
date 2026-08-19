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
