'use client';

import { Mail, MapPin, Phone } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { FacebookIcon, InstagramIcon, TiktokIcon } from '@/components/ui';
import { getImage } from '@/lib/data/images';
import { useTranslation } from '@/lib/i18n/I18nProvider';

// TODO: ganti '#' dengan URL akun asli begitu tersedia.
const socials = [
  { Icon: InstagramIcon, label: 'Instagram', href: '#' },
  { Icon: FacebookIcon, label: 'Facebook', href: '#' },
  { Icon: TiktokIcon, label: 'TikTok', href: '#' },
];

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const map = getImage('locationValley');

  return (
    <footer className="bg-basalt-900 px-7 pt-16 pb-8 text-stone-300">
      <div className="mx-auto grid max-w-310 gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        {/* Brand */}
        <div>
          <div className="font-serif text-[22px] font-semibold text-stone-50">
            D&apos;Glorious <span className="text-teal-300">Crater</span>
          </div>
          <p className="mt-3.5 max-w-70 text-sm leading-relaxed opacity-80">
            {t('footer.tagline')}
          </p>
          <div className="mt-4 flex gap-2.5">
            {socials.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-stone-50/10 transition-colors hover:bg-stone-50/20"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <div className="text-sm font-semibold text-stone-50">
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
          <div className="text-sm font-semibold text-stone-50">
            {t('footer.contact')}
          </div>
          <div className="mt-3.5 flex flex-col gap-2.5 text-sm opacity-85">
            <span className="flex items-center gap-2.5">
              <Phone
                size={15}
                strokeWidth={1.5}
                className="shrink-0"
                aria-hidden
              />
              0821-1234-5678
            </span>
            <span className="flex items-center gap-2.5">
              <Mail
                size={15}
                strokeWidth={1.5}
                className="shrink-0"
                aria-hidden
              />
              halo@dglorious.id
            </span>
            <span className="flex items-start gap-2.5">
              <MapPin
                size={15}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0"
                aria-hidden
              />
              Jl. Raya Kamojang, Ibun, Kab. Bandung 40384
            </span>
          </div>
        </div>

        {/* Location */}
        <div>
          <div className="text-sm font-semibold text-stone-50">
            {t('footer.location')}
          </div>
          <div className="relative mt-3.5 h-32.5 overflow-hidden rounded-2xl">
            <Image
              src={map.src}
              alt={map.alt}
              fill
              sizes="(min-width: 1024px) 260px, 100vw"
              className="object-cover"
              style={{ objectPosition: map.objectPosition }}
            />
          </div>
          <Link
            href="/login"
            className="mt-3 inline-block text-[13px] opacity-70 hover:opacity-100"
          >
            {t('footer.adminPortal')} →
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-[1240px] flex-wrap justify-between gap-2 border-t border-stone-50/10 pt-6 text-[13px] opacity-60">
        <span>
          © {year} {t('common.brand')}. {t('footer.rights')}
        </span>
        <span>{t('footer.legal')}</span>
      </div>
    </footer>
  );
}
