'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Angka yang "berjalan" ke nilai baru tiap kali `target` berubah.
 *
 * Sengaja TIDAK menganimasikan render pertama: nilai awal state = `target`,
 * jadi HTML hasil server dan render pertama klien selalu identik (tidak ada
 * hydration mismatch — pola yang sama dipakai [[useReveal]]). Animasi baru
 * jalan saat Owner ganti filter periode, dan justru di situ gunanya: mata
 * langsung ketarik ke angka mana yang berubah.
 *
 * Menghormati `prefers-reduced-motion` — kalau aktif, nilainya lompat langsung.
 */
export function useCountUp(target: number, duration = 650): number {
  const [value, setValue] = useState(target);
  // Nilai yang lagi tampil — bukan `target` — supaya animasi yang keburu
  // diinterupsi (ganti filter dua kali cepat) lanjut dari posisi terakhir,
  // bukan lompat balik ke awal.
  const valueRef = useRef(target);

  useEffect(() => {
    const from = valueRef.current;
    if (from === target) return;

    const commit = (v: number) => {
      valueRef.current = v;
      setValue(v);
    };

    // Lingkungan tanpa rAF (mis. test runner lawas): lompat lewat timer, bukan
    // setState langsung di badan efek — itu memicu cascading render.
    if (typeof requestAnimationFrame === 'undefined') {
      const id = setTimeout(() => commit(target), 0);
      return () => clearTimeout(id);
    }

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const ms = reduced ? 0 : duration;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = ms <= 0 ? 1 : Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      commit(from + (target - from) * eased);
      if (p < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}
