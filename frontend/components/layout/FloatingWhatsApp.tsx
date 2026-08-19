'use client';

import { useTranslation } from '@/lib/i18n/I18nProvider';
import { usePublicSettings, waLink } from '@/lib/usePublicSettings';

// Fase 1 pakai link wa.me manual (WhatsApp API otomatis = fase lanjutan).
// Nomor WA dari tabel `settings` (§8.3) lewat GET /settings, bukan hardcode.

export function FloatingWhatsApp() {
  const { t } = useTranslation();
  const { settings } = usePublicSettings();

  const href = waLink(
    settings?.whatsapp_number,
    'Halo D’Glorious Crater, saya ingin bertanya tentang penginapan.',
  );
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-visible:ring-mineral-500 group fixed right-5 bottom-5 z-[60] flex items-center gap-2.5 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none sm:right-6 sm:bottom-6"
      aria-label={t('common.waHelp')}
    >
      <span className="text-ash-800 border-ash-300/80 hidden rounded-full border bg-white px-4 py-2.5 text-sm font-medium sm:block">
        {t('common.waHelp')}
      </span>
      {/* Hijau #25D366 = identitas resmi WhatsApp, sengaja di luar palet situs
          supaya langsung dikenali sebagai kanal WhatsApp, bukan tombol biasa. */}
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white transition-colors duration-300 group-hover:bg-[#1fbb59]">
        <WhatsAppGlyph />
      </span>
    </a>
  );
}

/**
 * Lambang WhatsApp asli. Sebelumnya memakai `MessageCircle` dari lucide —
 * balon chat generik yang tidak dikenali sebagai WhatsApp, padahal warnanya
 * sudah memakai hijau resmi WhatsApp. Ikon dan warnanya sekarang sepakat.
 */
function WhatsAppGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="27"
      height="27"
      fill="currentColor"
      aria-hidden
      focusable="false"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.13-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.14.16-.29.18-.54.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.44.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.03s.87 2.35.99 2.51c.12.17 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}
