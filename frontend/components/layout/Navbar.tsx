'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { actionClass } from '@/components/public/ui';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { usePublicSettings, waLink } from '@/lib/usePublicSettings';
import { LanguageSwitcher } from './LanguageSwitcher';

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { settings } = usePublicSettings();

  const links = [
    { href: '/', label: t('nav.home'), exact: true },
    { href: '/tentang', label: t('nav.about') },
    { href: '/penginapan', label: t('nav.lodging') },
  ];

  const isActive = (l: { href: string; exact?: boolean }) =>
    l.exact ? pathname === l.href : pathname.startsWith(l.href);

  // Beranda dibuka dengan foto hero gelap sepenuh layar. Navbar solid di atas
  // foto itu memotongnya dengan pita terang; jadi di beranda navbar mulai
  // transparan dan baru mengeras setelah foto tergulung ke atas.
  const overHero = pathname === '/';
  const [lifted, setLifted] = useState(false);

  // Pendengar ini SELALU aktif, tidak lagi dipasang hanya saat di beranda.
  //
  // Versi sebelumnya memasangnya dengan syarat `if (!overHero) return`, dan itu
  // sumber bug navbar tersangkut putih: begitu pindah halaman pendengarnya
  // dicabut sementara `lifted` tertinggal bernilai true, lalu saat kembali ke
  // beranda pemulihannya bergantung pada siapa yang jalan lebih dulu — effect
  // React atau pengaturan ulang scroll oleh Next. Balapan itu hasilnya beda-beda
  // per perangkat dan per cara navigasi (tautan, tombol back, atau kembali dari
  // tab lain), jadi bug-nya muncul di sebagian orang saja.
  //
  // Dibiarkan selalu menyala, `lifted` tidak pernah basi. Biayanya nol: isinya
  // cuma membandingkan satu angka, dan `transparent` di bawah tetap yang
  // memutuskan halaman mana yang memakainya.
  // Navbar mengeras berdasarkan penanda `#puncak-halaman` di PublicLayout,
  // bukan berdasarkan window.scrollY di dalam pendengar scroll.
  //
  // Versi sebelumnya memasang pendengar scroll hanya saat berada di beranda,
  // dan itu menyimpan dua bug sekaligus. Pertama, pindah halaman mencabut
  // pendengarnya sementara nilainya tertinggal, jadi keadaan "putih" bisa ikut
  // terbawa kembali ke beranda. Kedua — yang benar-benar terlihat pengguna —
  // event scroll tiba dengan waktu yang tidak dijamin: pengukuran di browser
  // menunjukkan scrollY sudah 0 sementara header baru berubah sekitar satu
  // detik sesudahnya.
  //
  // IntersectionObserver tidak punya kedua masalah itu. Perpotongan dihitung
  // browser di luar thread utama, hasilnya konsisten, dan tidak peduli rute
  // mana yang sedang aktif maupun bagaimana pengguna sampai ke sini —
  // tautan, tombol back, atau kembali dari tab lain.
  useEffect(() => {
    const sentinel = document.getElementById('puncak-halaman');
    if (!sentinel) return;
    const io = new IntersectionObserver(
      ([entry]) => setLifted(!entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, [pathname]);

  // Menu mobile terbuka mengunci scroll halaman di baliknya.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Esc menutup menu — pola yang sama dengan Modal di dashboard.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const transparent = overHero && !lifted && !open;
  const waHref = waLink(
    settings?.whatsapp_number,
    'Halo D’Glorious Crater, saya ingin bertanya soal reservasi penginapan.',
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-colors duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        transparent
          ? 'border-b border-transparent bg-transparent'
          : 'border-ash-300/70 bg-ash-50/92 border-b backdrop-blur-md',
      )}
    >
      <div className="container-page flex h-18 items-center justify-between gap-6">
        <Link
          href="/"
          className="focus-visible:ring-mineral-500 -m-2 flex items-center gap-3 rounded-lg p-2 focus-visible:ring-2 focus-visible:outline-none"
        >
          <SteamMark />
          <span className="leading-none">
            <span
              className={cn(
                'block font-serif text-[1.15rem] tracking-[-0.01em]',
                transparent ? 'text-ash-50' : 'text-ash-900',
              )}
            >
              D&apos;Glorious
            </span>
            <span
              className={cn(
                'mt-1 block text-[11.5px] font-semibold tracking-[0.19em] uppercase',
                transparent ? 'text-ash-50/70' : 'text-ash-600',
              )}
            >
              Crater Kamojang
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l) ? 'page' : undefined}
              className={cn(
                'focus-visible:ring-mineral-500 rounded-full px-4 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
                transparent
                  ? isActive(l)
                    ? 'text-ash-50 font-semibold'
                    : 'text-ash-50/75 hover:text-ash-50 font-medium'
                  : isActive(l)
                    ? 'text-mineral-700 bg-mineral-50 font-semibold'
                    : 'text-ash-700 hover:text-mineral-700 hover:bg-ash-200/60 font-medium',
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={actionClass(
                transparent ? 'onPhoto' : 'primary',
                'md',
                'hidden lg:inline-flex',
              )}
            >
              {t('nav.reserve')}
            </a>
          )}
          <button
            type="button"
            className={cn(
              'focus-visible:ring-mineral-500 flex h-11 w-11 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none lg:hidden',
              transparent
                ? 'text-ash-50 hover:bg-ash-50/15'
                : 'text-ash-800 hover:bg-ash-200/70',
            )}
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={open}
            aria-controls="menu-utama"
          >
            {open ? (
              <X size={21} strokeWidth={1.5} aria-hidden />
            ) : (
              <Menu size={21} strokeWidth={1.5} aria-hidden />
            )}
          </button>
        </div>
      </div>

      <nav
        id="menu-utama"
        className={cn(
          'border-ash-300 bg-ash-50 border-t lg:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div className="container-page flex flex-col py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l) ? 'page' : undefined}
              className={cn(
                'flex min-h-12 items-center rounded-lg px-3 text-[0.95rem] transition-colors',
                isActive(l)
                  ? 'text-mineral-700 bg-mineral-50 font-semibold'
                  : 'text-ash-800 hover:bg-ash-200/70 font-medium',
              )}
            >
              {l.label}
            </Link>
          ))}
          {waHref && (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className={actionClass('primary', 'lg', 'mt-3 w-full')}
            >
              {t('nav.reserve')}
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}

/**
 * Penanda merek sementara sampai file logo asli tersedia (keputusan user
 * 2026-08-18: jalan dulu tanpa file logo). Tiga batang naik dengan tinggi
 * berbeda — uap yang mengepul dari kawah — memakai tiga warna logo apa adanya:
 * hijau daun, biru air, emas panas bumi. Sengaja TIDAK meniru bentuk logo
 * aslinya; menggambar ulang lambang klien secara kira-kira lebih buruk
 * daripada penanda jujur yang gampang diganti begitu filenya ada.
 */
function SteamMark() {
  return (
    <span aria-hidden className="flex h-7 items-end gap-[3px]">
      <span className="bg-moss-400 h-3.5 w-[3px] rounded-full" />
      <span className="bg-mineral-500 h-6 w-[3px] rounded-full" />
      <span className="bg-sulfur-400 h-4.5 w-[3px] rounded-full" />
    </span>
  );
}
