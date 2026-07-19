'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImagePlaceholder, Input } from '@/components/ui';
import { useTranslation } from '@/lib/i18n/I18nProvider';

// TODO(FASE 2): ganti dengan POST /auth/login (JWT). Ini simulasi UI.
export function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="flex min-h-screen">
      {/* Art */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <ImagePlaceholder icon="🌋" label="Foto kawah berkabut" className="absolute inset-0" />
        <div className="from-forest-900/35 to-forest-900/80 absolute inset-0 bg-linear-to-b" />
        <div className="absolute bottom-14 left-14 text-cream-100">
          <div className="font-serif text-[34px] leading-[1.1] font-bold">
            D&apos;Glorious Crater
            <br />
            Kamojang
          </div>
          <div className="mt-3 text-sm tracking-[0.14em] uppercase opacity-85">
            {t('login.consoleLabel')}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex w-full flex-col justify-center bg-[#fbfaf6] px-8 py-14 sm:px-14 lg:w-[480px] lg:flex-none">
        <div className="text-forest-700 font-serif text-[26px] font-extrabold">
          D&apos;Glorious <span className="text-terracotta-500">Crater</span>
        </div>
        <div className="mt-10 font-serif text-3xl font-bold">{t('login.title')}</div>
        <div className="text-muted mt-1.5 text-sm">{t('login.subtitle')}</div>

        <div className="mt-7 flex flex-col gap-4.5">
          <Input label={t('login.email')} name="email" type="email" defaultValue="admin@dglorious.id" />
          <Input label={t('login.password')} name="password" type="password" defaultValue="123456" />
        </div>

        <div className="text-muted mt-4 text-[13px]">{t('login.asRole')}</div>
        <div className="mt-2 flex gap-2.5">
          <button
            onClick={() => router.push('/admin/penginapan')}
            className="bg-forest-700 hover:bg-forest-800 flex-1 rounded-xl py-3.5 text-sm font-semibold text-white transition-colors"
          >
            {t('login.adminBtn')}
          </button>
          <button
            onClick={() => router.push('/owner')}
            className="border-terracotta-500 text-terracotta-500 hover:bg-terracotta-50 flex-1 rounded-xl border bg-white py-3.5 text-sm font-semibold transition-colors"
          >
            {t('login.ownerBtn')}
          </button>
        </div>

        <Link href="/" className="text-muted mt-6 text-[13px] hover:text-forest-700">
          {t('login.backHome')}
        </Link>
      </div>
    </div>
  );
}
