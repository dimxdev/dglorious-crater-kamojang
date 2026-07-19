'use client';

import Link from 'next/link';
import { ImagePlaceholder } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#14352A] px-7 pt-16 pb-8 text-[#cbd8cf]">
      <div className="mx-auto grid max-w-310 gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        {/* Brand */}
        <div>
          <div className="font-serif text-[22px] font-extrabold text-cream-100">
            D&apos;Glorious <span className="text-terracotta-500">Crater</span>
          </div>
          <p className="mt-3.5 max-w-70 text-sm leading-relaxed opacity-80">
            {t('footer.tagline')}
          </p>
          <div className="mt-4 flex gap-2.5">
            {['📷', '📘', '🎵'].map((s, i) => (
              <span
                key={i}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-cream-100/10"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <div className="text-sm font-semibold text-cream-100">
            {t('footer.explore')}
          </div>
          <div className="mt-3.5 flex flex-col gap-2.5 text-sm">
            <Link href="/" className="opacity-85 hover:opacity-100">
              {t('nav.home')}
            </Link>
            <Link href="/tentang" className="opacity-85 hover:opacity-100">
              {t('nav.about')}
            </Link>
            <Link href="/penginapan" className="opacity-85 hover:opacity-100">
              {t('nav.lodging')}
            </Link>
            <Link href="/cek-booking" className="opacity-85 hover:opacity-100">
              {t('nav.checkBooking')}
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div>
          <div className="text-sm font-semibold text-cream-100">
            {t('footer.contact')}
          </div>
          <div className="mt-3.5 flex flex-col gap-2.5 text-sm opacity-85">
            <span>📞 0821-1234-5678</span>
            <span>✉️ halo@dglorious.id</span>
            <span>📍 Jl. Raya Kamojang, Ibun, Kab. Bandung 40384</span>
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="text-sm font-semibold text-cream-100">
            {t('footer.location')}
          </div>
          <div className="mt-3.5 h-32.5 overflow-hidden rounded-2xl">
            <ImagePlaceholder icon="🗺️" label="Peta lokasi" />
          </div>
          <Link
            href="/login"
            className="mt-3 inline-block text-[13px] opacity-70 hover:opacity-100"
          >
            {t('footer.adminPortal')} →
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[1240px] flex-wrap justify-between gap-2 border-t border-cream-100/10 pt-6 text-[13px] opacity-60">
        <span>
          © {year} {t('common.brand')}. {t('footer.rights')}
        </span>
        <span>{t('footer.legal')}</span>
      </div>
    </footer>
  );
}
