'use client';

import { useEffect, useState } from 'react';
import { fetchPublicSettings } from '@/lib/api/settings';

/**
 * Settings global (no. WA, jam check-in/out, S&K) untuk halaman publik.
 *
 * Sebelumnya `FloatingWhatsApp`, `DetailPage`, dan `TermsPage` masing-masing
 * memanggil `GET /settings` sendiri-sendiri, jadi satu halaman detail memicu
 * tiga permintaan yang isinya sama persis. Sekarang navbar ikut butuh nomor WA
 * untuk CTA-nya, yang akan bikin jadi empat.
 *
 * Cache-nya di level modul, bukan React Context: nilainya tidak pernah berubah
 * sepanjang satu kunjungan, jadi provider cuma akan menambah lapisan tanpa
 * memberi apa pun. Promise-nya sendiri yang disimpan supaya beberapa komponen
 * yang mount bersamaan ikut menunggu permintaan yang sama, bukan memicu
 * permintaan baru masing-masing.
 */

type Settings = Record<string, string>;

let cached: Promise<Settings> | null = null;

function loadSettings(): Promise<Settings> {
  if (!cached) {
    // Kegagalan tidak di-cache: kalau backend sedang mati saat kunjungan
    // dimulai, percobaan berikutnya harus bisa berhasil.
    cached = fetchPublicSettings().catch((e) => {
      cached = null;
      throw e;
    });
  }
  return cached;
}

export function usePublicSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadSettings()
      .then((s) => active && setSettings(s))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  return { settings, failed };
}

/** Link wa.me lengkap dengan pesan awal, atau null kalau nomor belum termuat. */
export function waLink(number: string | undefined, message: string) {
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
