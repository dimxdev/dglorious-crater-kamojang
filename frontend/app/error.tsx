'use client';

import { useEffect } from 'react';

/**
 * Layar galat runtime.
 *
 * Sengaja berdiri sendiri tanpa `PublicLayout`: berkas ini adalah penangkap
 * terakhir untuk SELURUH aplikasi, termasuk rute dashboard — memasang navbar
 * dan footer publik di atas galat halaman admin justru membingungkan.
 *
 * Teksnya menyebut apa yang bisa dilakukan pengguna, bukan meminta maaf.
 * Galat tidak minta maaf, dan tidak samar soal apa yang terjadi.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Belum ada layanan pelaporan galat di fase 1; konsol dulu supaya
    // jejaknya tidak hilang begitu saja saat dites manual.
    console.error(error);
  }, [error]);

  return (
    <div className="bg-ash-100 flex min-h-[100dvh] items-center justify-center px-7 py-16">
      <div className="w-full max-w-md">
        <span aria-hidden className="flex h-7 items-end gap-[3px]">
          <span className="bg-moss-400 h-3.5 w-[3px] rounded-full" />
          <span className="bg-mineral-500 h-6 w-[3px] rounded-full" />
          <span className="bg-sulfur-400 h-4.5 w-[3px] rounded-full" />
        </span>

        <h1 className="text-ash-900 mt-7 font-serif text-[1.85rem] leading-tight tracking-[-0.02em]">
          Halaman ini gagal dimuat
        </h1>
        <p className="text-ash-600 mt-3 text-[15px] leading-relaxed">
          Ada yang tersendat saat menyiapkan halaman ini. Coba muat ulang — kalau
          masih sama, kembali ke beranda dan buka lagi dari sana.
        </p>

        {error.digest && (
          <p className="text-ash-600 mt-5 font-mono text-xs">
            Kode galat: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="bg-sulfur-400 text-moss-900 hover:bg-sulfur-300 focus-visible:ring-mineral-500 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full px-6 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Muat ulang halaman
          </button>
          <a
            href="/"
            className="border-ash-300 text-ash-800 hover:bg-ash-200/70 focus-visible:ring-mineral-500 inline-flex min-h-11 items-center justify-center rounded-full border px-6 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Kembali ke beranda
          </a>
        </div>
      </div>
    </div>
  );
}
