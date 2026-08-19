'use client';

import { ArrowUpRight, Mail, MapPin, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { InstagramIcon } from '@/components/ui';
import { MAPS_URL } from '@/lib/data/visit';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { usePublicSettings, waLink } from '@/lib/usePublicSettings';

const ADDRESS = 'Kp. Kamojang, Desa Laksana, Kec. Ibun, Kab. Bandung, Jawa Barat';

// Embed Google Maps tanpa API key. `output=embed` adalah jalur publik yang
// tidak butuh kunci maupun tagihan — sesuai permintaan ketua supaya biaya
// server tidak naik. `loading="lazy"` menahan permintaan ke Google sampai
// footer benar-benar mendekati layar, jadi peta ini tidak ikut memperlambat
// muatan awal halaman.
const MAPS_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(
  "D'Glorious Crater Kamojang",
)}&output=embed`;

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const { settings } = usePublicSettings();

  const waHref = waLink(
    settings?.whatsapp_number,
    'Halo D’Glorious Crater, saya ingin bertanya tentang penginapan.',
  );
  const email = settings?.contact_email;
  const instagram = settings?.instagram_url;

  return (
    <footer className="bg-moss-900 text-ash-300 pt-20 pb-8">
      <div className="container-page grid gap-12 lg:grid-cols-[1.1fr_0.8fr_1fr_1.3fr]">
        <div>
          <div className="text-ash-50 font-serif text-[1.4rem] tracking-[-0.01em]">
            D&apos;Glorious Crater
          </div>
          <p className="text-ash-300/75 mt-4 max-w-64 text-sm leading-relaxed">
            {t('footer.tagline')}
          </p>
          {instagram && (
            <a
              href={instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-ash-50/10 hover:bg-ash-50/20 focus-visible:ring-moss-400 text-ash-200 mt-6 inline-flex min-h-11 items-center gap-2.5 rounded-full px-4 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              <InstagramIcon size={15} />
              @dgloriouscraterkamojang
            </a>
          )}
        </div>

        <nav aria-labelledby="footer-jelajahi">
          <div id="footer-jelajahi" className="text-ash-50 text-sm font-semibold">
            {t('footer.explore')}
          </div>
          <div className="mt-4 flex flex-col gap-1">
            {[
              { href: '/', label: t('nav.home') },
              { href: '/tentang', label: t('nav.about') },
              { href: '/penginapan', label: t('nav.lodging') },
              { href: '/syarat-ketentuan', label: t('footer.terms') },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ash-300/85 hover:text-ash-50 focus-visible:ring-moss-400 -mx-2 flex min-h-10 items-center rounded px-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>

        <div>
          <div className="text-ash-50 text-sm font-semibold">
            {t('footer.contact')}
          </div>
          <div className="mt-4 flex flex-col gap-1">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ash-300/85 hover:text-ash-50 focus-visible:ring-moss-400 -mx-2 flex min-h-10 items-center gap-2.5 rounded px-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <MessageCircle size={15} strokeWidth={1.5} className="shrink-0" aria-hidden />
                0811-1000-3016
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="text-ash-300/85 hover:text-ash-50 focus-visible:ring-moss-400 -mx-2 flex min-h-10 items-center gap-2.5 rounded px-2 text-sm break-all transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <Mail size={15} strokeWidth={1.5} className="shrink-0" aria-hidden />
                {email}
              </a>
            )}
            <p className="text-ash-300/85 -mx-2 flex gap-2.5 px-2 py-2 text-sm leading-relaxed">
              <MapPin size={15} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden />
              {ADDRESS}
            </p>
          </div>
        </div>

        <div>
          <div className="text-ash-50 text-sm font-semibold">
            {t('footer.location')}
          </div>
          {/* Peta sungguhan, bukan foto pemandangan yang ditaruh di bawah label
              "Lokasi". Bisa digeser dan di-zoom di tempat; tombol di bawahnya
              untuk yang mau langsung membuka navigasi. */}
          <div className="border-ash-50/12 mt-4 overflow-hidden rounded-2xl border">
            <iframe
              src={MAPS_EMBED}
              title={t('footer.mapTitle')}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-44 w-full border-0"
            />
          </div>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ash-300/85 hover:text-ash-50 focus-visible:ring-moss-400 -mx-2 mt-2 inline-flex min-h-10 items-center gap-1.5 rounded px-2 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            {t('footer.openMaps')}
            <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden />
          </a>
        </div>
      </div>

      <div className="container-page border-ash-50/12 text-ash-300/60 mt-14 flex flex-wrap justify-between gap-3 border-t pt-6 text-[13px]">
        <span>
          © {year} {t('common.brand')}. {t('footer.rights')}
        </span>
        <Link href="/login" className="hover:text-ash-300 transition-colors">
          {t('footer.adminPortal')}
        </Link>
      </div>
    </footer>
  );
}
