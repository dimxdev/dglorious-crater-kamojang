'use client';

import { useEffect, useRef } from 'react';

/**
 * Reveal sekali jalan saat elemen masuk viewport.
 *
 * Hook ini hanya membalik atribut `data-reveal` jadi `"shown"`; seluruh gaya
 * visualnya ada di globals.css, di dalam media query
 * `prefers-reduced-motion: no-preference`. Konsekuensinya:
 *
 * - Saat pengguna minta reduced-motion, aturan CSS-nya tidak aktif sama sekali,
 *   jadi elemen langsung terlihat tanpa animasi.
 * - Markup yang dirender server dan klien selalu identik (tidak ada cabang
 *   JSX berdasarkan media query), jadi tidak ada risiko hydration mismatch.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Browser tanpa IntersectionObserver: tampilkan langsung.
    if (typeof IntersectionObserver === 'undefined') {
      el.dataset.reveal = 'shown';
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = 'shown';
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}
