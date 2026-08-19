'use client';

import { ArrowLeft, TriangleAlert } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { actionClass } from '@/components/public/ui';
import { Input } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { roleHomePath } from '@/lib/auth/roleHome';
import { getImage } from '@/lib/data/images';
import { useTranslation } from '@/lib/i18n/I18nProvider';

export function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { login } = useAuth();
  const art = getImage('hero');

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
      // 401 = email/password salah (backend sengaja memberi pesan sama untuk
      // keduanya, lihat backend/src/auth/auth.service.ts). Selain itu tak terduga.
      setError(
        err instanceof ApiError && err.status === 401
          ? t('login.errorInvalid')
          : t('login.errorGeneric'),
      );
      setPending(false);
    }
  }

  return (
    // min-h-[100dvh], bukan min-h-screen: di Safari iOS `100vh` dihitung dari
    // viewport saat bilah alamat tersembunyi, jadi halamannya meloncat tiap
    // bilah itu muncul-hilang.
    <div className="bg-ash-100 flex min-h-[100dvh]">
      {/* Sisi kiri: foto asli kawah. Sebelumnya placeholder gradien beremoji
          🌋 — padahal foto kawahnya sudah ada di manifest sejak awal. */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        <Image
          src={art.src}
          alt=""
          fill
          sizes="50vw"
          priority
          className="object-cover"
          style={{ objectPosition: art.objectPosition }}
        />
        <div className="from-moss-900/92 via-moss-900/45 absolute inset-0 bg-linear-to-t to-transparent" />
        <div className="text-ash-50 absolute inset-x-14 bottom-14">
          <div className="font-serif text-[2.1rem] leading-[1.1] tracking-[-0.02em]">
            D&apos;Glorious Crater
            <br />
            Kamojang
          </div>
          <div className="text-ash-50/75 mt-3 text-xs tracking-[0.2em] uppercase">
            {t('login.consoleLabel')}
          </div>
        </div>
      </div>

      {/* Sisi kanan: form */}
      <div className="flex w-full flex-col justify-center px-7 py-14 sm:px-14 lg:w-[27rem] lg:flex-none">
        <Link
          href="/"
          className="text-ash-600 hover:text-mineral-700 focus-visible:ring-mineral-500 -mx-2 mb-12 flex w-fit items-center gap-2 rounded px-2 py-1 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
          {t('login.backHome')}
        </Link>

        <span aria-hidden className="mb-6 flex h-7 items-end gap-[3px]">
          <span className="bg-moss-400 h-3.5 w-[3px] rounded-full" />
          <span className="bg-mineral-500 h-6 w-[3px] rounded-full" />
          <span className="bg-sulfur-400 h-4.5 w-[3px] rounded-full" />
        </span>

        <h1 className="text-ash-900 font-serif text-[1.85rem] leading-tight tracking-[-0.02em]">
          {t('login.title')}
        </h1>
        <p className="text-ash-600 mt-2 text-sm">{t('login.subtitle')}</p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4.5">
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
            /* Latar bernada, bukan garis tepi kiri berwarna: garis samping
               tebal pada callout adalah pola hias yang tidak menambah
               keterbacaan — permukaannya sendiri yang harus menandai ini
               pesan galat. */
            <p
              role="alert"
              className="flex gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              <TriangleAlert
                size={16}
                strokeWidth={1.75}
                className="mt-0.5 shrink-0 text-red-600"
                aria-hidden
              />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className={actionClass(
              'primary',
              'lg',
              'mt-2 w-full disabled:cursor-not-allowed disabled:opacity-60',
            )}
          >
            {pending ? t('login.submitting') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
