'use client';

import { useId } from 'react';
import { cn } from '@/lib/cn';
import type { Locale } from '@/lib/i18n/config';

/**
 * Bendera bahasa sebagai SVG inline — SENGAJA bukan emoji (🇮🇩/🇬🇧).
 * Windows tidak punya glyph bendera sama sekali, jadi emoji bendera di sana
 * dirender sebagai dua huruf kode wilayah ("ID", "GB"), bukan gambar. SVG
 * tampil sama di semua platform.
 *
 * Catatan buat penambahan bahasa berikutnya (中文, §9 PROJECT.md): bendera
 * mewakili NEGARA, bukan bahasa — pemilihannya untuk bahasa yang dipakai di
 * banyak negara perlu dipikir dulu, bukan sekadar ambil satu.
 */
export function LocaleFlag({ locale, className }: { locale: Locale; className?: string }) {
  // `useId` bikin id clipPath unik per instance — kalau di-hardcode, bendera
  // yang dirender lebih dari sekali (tombol + daftar) bakal duplikat id dan
  // klip-nya nyasar ke instance pertama.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');

  const box = cn(
    'h-3.5 w-5 shrink-0 rounded-[2px] ring-1 ring-black/10',
    className,
  );

  if (locale === 'id') {
    // Merah Putih — dua bidang horizontal sama tinggi.
    return (
      <svg viewBox="0 0 60 40" className={box} preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="60" height="20" fill="#CE1126" />
        <rect y="20" width="60" height="20" fill="#FFFFFF" />
      </svg>
    );
  }

  // Union Jack untuk English.
  const clip = `uj-${uid}`;
  return (
    <svg viewBox="0 0 60 30" className={box} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <clipPath id={clip}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <rect width="60" height="30" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
      <path
        d="M0,0 L60,30 M60,0 L0,30"
        clipPath={`url(#${clip})`}
        stroke="#C8102E"
        strokeWidth="4"
      />
      <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}
