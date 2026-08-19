import { FloatingWhatsApp } from './FloatingWhatsApp';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

/**
 * Layout halaman publik: navbar + konten + footer + tombol WhatsApp mengambang.
 *
 * Latar disetel di sini (`bg-ash-100`), bukan di `body`, karena `body` masih
 * memakai `--color-background` lama yang dipakai bersama dashboard — palet
 * baru ini khusus sisi publik.
 */
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-ash-100 text-ash-900 relative flex min-h-full flex-col">
      {/* Penanda puncak halaman. Navbar mengamatinya lewat IntersectionObserver
          untuk tahu apakah pembaca sedang di puncak — bukan dengan membaca
          window.scrollY di dalam pendengar scroll. Bedanya penting: event
          scroll tiba dengan waktu yang tidak dijamin (pengukuran menunjukkan
          scrollY sudah 0 sementara header baru berubah ~1 detik kemudian),
          sedangkan perpotongan elemen dihitung browser sendiri dan selalu
          konsisten. Tingginya disamakan dengan tinggi navbar. */}
      <div
        id="puncak-halaman"
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 h-18 w-px"
      />
      {/* Lompatan papan ketik: navbar punya beberapa tautan + switcher bahasa
          sebelum isi halaman, jadi tanpa ini pengguna keyboard harus menekan
          Tab melewati semuanya di setiap halaman. */}
      <a
        href="#konten"
        className="bg-sulfur-400 text-moss-900 focus:ring-mineral-500 sr-only rounded-full px-5 py-3 text-sm font-semibold focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[70] focus:ring-2 focus:outline-none"
      >
        Lompat ke konten
      </a>
      <Navbar />
      <main id="konten" className="flex-1">
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
