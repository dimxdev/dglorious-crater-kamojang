import { cn } from '@/lib/cn';

/**
 * Kelas aksi untuk halaman publik.
 *
 * Dibuat terpisah dari `components/ui/Button` yang dipakai dashboard: keputusan
 * user 2026-08-18 adalah tampilan admin tidak boleh berubah sama sekali, jadi
 * komponen bersama itu tidak disentuh dan halaman publik memakai kelas sendiri.
 *
 * Dibuat sebagai pembangun kelas, bukan komponen, karena sebagian besar "tombol"
 * di sisi publik sebenarnya `Link` atau `<a>` ke WhatsApp — membungkusnya dalam
 * `<button>` cuma akan menghasilkan tombol di dalam tautan.
 *
 * Emas sulfur SELALU jadi latar dengan teks moss-900 di atasnya, tidak pernah
 * jadi warna teks di latar terang: emas di atas putih cuma sekitar 2:1, gagal
 * kontras. Sebagai latar dengan teks gelap, rasionya di atas 9:1.
 */

type Tone = 'primary' | 'quiet' | 'onPhoto' | 'whatsapp';
type Size = 'md' | 'lg';

const tones: Record<Tone, string> = {
  // CTA utama — satu-satunya tempat emas panas bumi dipakai.
  primary: 'bg-sulfur-400 text-moss-900 hover:bg-sulfur-300',
  quiet: 'border border-ash-300 text-ash-800 bg-transparent hover:bg-ash-200/70 hover:border-ash-400',
  onPhoto: 'border border-ash-50/55 text-ash-50 bg-ash-50/8 hover:bg-ash-50/18 backdrop-blur-[2px]',
  whatsapp: 'bg-[#25D366] text-[#0b2e18] hover:bg-[#1fbb59]',
};

const sizes: Record<Size, string> = {
  // min-h 44px = ambang batas sasaran sentuh.
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-13 px-7 text-[0.95rem]',
};

export function actionClass(
  tone: Tone = 'primary',
  size: Size = 'md',
  className?: string,
) {
  return cn(
    'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-semibold',
    'transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
    'active:translate-y-px',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mineral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ash-100',
    tones[tone],
    sizes[size],
    className,
  );
}
