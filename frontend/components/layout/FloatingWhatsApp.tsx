'use client';

import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchPublicSettings } from '@/lib/api/settings';
import { useTranslation } from '@/lib/i18n/I18nProvider';

// Fase 1 pakai link wa.me manual (WhatsApp API otomatis = fase lanjutan).
// Nomor WA diambil dari tabel `settings` (§8.3) lewat GET /settings, bukan hardcode.

export function FloatingWhatsApp() {
  const { t } = useTranslation();
  const [waNumber, setWaNumber] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicSettings()
      .then((settings) => setWaNumber(settings.whatsapp_number))
      .catch(() => setWaNumber(null));
  }, []);

  if (!waNumber) return null;

  const href = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Halo D'Glorious Crater, saya ingin bertanya tentang penginapan.",
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-6 bottom-6 z-[60] flex items-center gap-3"
      aria-label="Chat WhatsApp"
    >
      <span className="text-basalt-800 hidden rounded-2xl bg-white px-4 py-2.5 text-sm font-medium shadow-[0_10px_30px_-12px_rgba(0,0,0,0.3)] sm:block">
        {t('common.waHelp')}
      </span>
      {/* Hijau #25D366 = identitas resmi WhatsApp, sengaja di luar palet situs. */}
      <span className="flex h-15 w-15 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_26px_-8px_rgba(37,211,102,0.6)] transition-transform hover:scale-105">
        <MessageCircle size={28} strokeWidth={1.5} aria-hidden />
      </span>
    </a>
  );
}
