'use client';

import { useEffect, useState } from 'react';
import { fetchSiteContent, type SiteContent } from '@/lib/api/siteContent';

/**
 * Konten CMS (`GET /site-content`) untuk halaman publik.
 *
 * Pola cache sama dengan `usePublicSettings`: promise-nya disimpan di level
 * modul supaya navbar, footer, tombol WhatsApp, dan halaman yang sedang dibuka
 * ikut menunggu satu permintaan yang sama, dan kegagalan tidak di-cache supaya
 * kunjungan berikutnya bisa mencoba lagi. Kedua bahasa dikirim sekaligus, jadi
 * ganti locale tidak memicu permintaan baru.
 */

let cached: Promise<SiteContent> | null = null;

function loadContent(): Promise<SiteContent> {
  if (!cached) {
    cached = fetchSiteContent().catch((e) => {
      cached = null;
      throw e;
    });
  }
  return cached;
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    loadContent()
      .then((c) => active && setContent(c))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, []);

  return { content, failed };
}
