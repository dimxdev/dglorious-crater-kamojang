'use client';

import { useEffect } from 'react';

/**
 * Kunci scroll halaman selama overlay (modal/drawer) terbuka.
 *
 * Kenapa perlu:
 *
 * 1. **Scrollbar dobel.** Panel overlay punya area scroll sendiri. Kalau
 *    halaman di belakangnya masih ikut bisa di-scroll, dua scrollbar muncul
 *    bersamaan di tepi kanan.
 * 2. **Scrollbar kedip-kedip.** Dropdown Radix (`Select`) mengunci scroll body
 *    sendiri tiap kali dibuka. Kalau halaman belum terkunci, tiap buka/tutup
 *    dropdown scrollbar halaman ikut hilang-muncul — layout bergeser 15px dan
 *    kelihatan berkedip. Begitu halaman sudah terkunci duluan, kunci milik
 *    Radix jadi tidak mengubah apa-apa secara visual.
 * 3. Roda mouse di atas overlay tidak lagi menggulung halaman di belakangnya.
 *
 * `paddingRight` diisi selebar scrollbar yang hilang — tanpa itu, konten
 * melebar 15px begitu scrollbar dicabut dan halaman "meloncat".
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const { body, documentElement: html } = document;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;

    // Selisih lebar viewport vs lebar dokumen = lebar scrollbar. Di browser
    // dengan overlay scrollbar (macOS default) hasilnya 0 — dan itu benar,
    // memang tidak ada lebar yang perlu diganti.
    const scrollbarWidth = window.innerWidth - html.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      const currentPadding = parseFloat(getComputedStyle(body).paddingRight) || 0;
      body.style.paddingRight = `${currentPadding + scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
    };
  }, [active]);
}
