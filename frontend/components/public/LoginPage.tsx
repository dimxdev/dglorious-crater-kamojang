'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ImagePlaceholder, Input } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { roleHomePath } from '@/lib/auth/roleHome';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const user = await login(email, password);
      router.push(roleHomePath(user.role));
    } catch (err) {
      // 401 = wrong email/password (backend gives the same message for both,
      // see backend/src/auth/auth.service.ts). Anything else is unexpected.
      setError(
        err instanceof ApiError && err.status === 401
          ? t('login.errorInvalid')
          : t('login.errorGeneric'),
      );
      setPending(false);
    }
  }

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

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-4.5">
          <Input
            label={t('login.email')}
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={t('login.password')}
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="bg-forest-700 hover:bg-forest-800 mt-1 rounded-xl py-3.5 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? t('login.submitting') : t('login.submit')}
          </button>
        </form>

        <Link href="/" className="text-muted mt-6 text-[13px] hover:text-forest-700">
          {t('login.backHome')}
        </Link>
      </div>
    </div>
  );
}
