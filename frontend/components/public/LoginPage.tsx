'use client';

import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  Mountain,
  TriangleAlert,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Contour } from '@/components/public/ui';
import { ApiError } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/AuthProvider';
import { roleHomePath } from '@/lib/auth/roleHome';
import { cn } from '@/lib/cn';
import { getImage } from '@/lib/data/images';
import { useTranslation } from '@/lib/i18n/I18nProvider';

/** Wordmark dipakai di panel foto (varian terang) & header mobile (varian gelap). */
function Wordmark({ tone }: { tone: 'light' | 'dark' }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-xl',
          tone === 'light' ? 'bg-ash-50/12 text-sulfur-300 backdrop-blur-[2px]' : 'bg-moss-900 text-sulfur-300',
        )}
      >
        <Mountain size={18} strokeWidth={1.6} aria-hidden />
      </span>
      <span
        className={cn(
          'font-serif text-[17px] leading-tight font-bold',
          tone === 'light' ? 'text-ash-50' : 'text-moss-900',
        )}
      >
        D&apos;Glorious <span className="text-sulfur-500">Crater</span>
      </span>
    </span>
  );
}

/** Field terkontrol dengan ikon depan + slot aksi (mis. tombol lihat sandi). */
function Field({
  id,
  label,
  type,
  icon: Icon,
  value,
  autoComplete,
  onChange,
  trailing,
}: {
  id: string;
  label: string;
  type: string;
  icon: typeof Mail;
  value: string;
  autoComplete: string;
  onChange: (v: string) => void;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-ash-700 text-[13px] font-semibold">
        {label}
      </label>
      <div className="group relative">
        <Icon
          size={17}
          strokeWidth={1.75}
          className="text-ash-400 group-focus-within:text-mineral-500 pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 transition-colors"
          aria-hidden
        />
        <input
          id={id}
          name={id}
          type={type}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'text-ash-900 placeholder:text-ash-400 h-12 w-full rounded-xl border bg-white/70 pl-11 text-sm shadow-sm',
            'border-ash-300 transition-[border-color,box-shadow,background-color]',
            'focus:border-mineral-400 focus:ring-mineral-500/15 focus:bg-white focus:ring-4 focus:outline-none',
            trailing ? 'pr-11' : 'pr-3.5',
          )}
        />
        {trailing && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, isLoading, login } = useAuth();
  const art = getImage('hero');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Sudah login (mis. buka /login lagi dari tab/riwayat lama) → jangan
  // tampilkan form, langsung pental ke dashboard role-nya sendiri.
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(roleHomePath(user.role));
    }
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return <div className="bg-ash-100 min-h-[100dvh]" />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const loggedIn = await login(email, password);
      router.push(roleHomePath(loggedIn.role));
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
      {/* ── Panel kiri: foto kawah asli + tanda tangan kontur ─────────────── */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        {/* Lapisan latar (foto → scrim → kontur), digambar berurutan sesuai
            urutan DOM. Sengaja TANPA z negatif: z negatif akan mendorong foto
            ke belakang latar `bg-ash-100` halaman yang solid → hilang total. */}
        <Image
          src={art.src}
          alt=""
          fill
          sizes="55vw"
          priority
          className="object-cover"
          style={{ objectPosition: art.objectPosition }}
        />
        {/* Scrim dari bawah — teks di kaki panel harus terbaca di atas foto,
            atasnya dibiarkan lebih bening biar fotonya tetap napas. */}
        <div className="from-moss-900 via-moss-900/55 to-moss-900/25 absolute inset-0 bg-linear-to-t" />
        {/* Garis kontur — bahasa visual utama situs; di sini jadi tekstur halus
            di kaki panel, menegaskan ini portal "tentang sebuah kawah". */}
        <Contour
          variant="band"
          className="text-ash-50/25 absolute inset-x-0 bottom-0 h-56 w-full"
        />

        {/* Lapisan isi — diangkat ke atas semua lapisan latar dengan z-10. */}
        <div className="absolute inset-0 z-10 flex flex-col justify-end p-12 xl:p-14">
          <div>
            <div className="bg-ash-50/12 text-ash-50/90 mb-5 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] tracking-[0.18em] uppercase backdrop-blur-[2px]">
              {t('login.consoleLabel')}
            </div>
            <h2 className="text-ash-50 max-w-md font-serif text-[2.4rem] leading-[1.08] tracking-[-0.02em]">
              {t('login.heroHeadline')}
            </h2>
            <p className="text-ash-50/70 mt-4 max-w-sm text-sm leading-relaxed">
              {t('login.heroSub')}
            </p>
          </div>
        </div>
      </div>

      {/* ── Panel kanan: form ─────────────────────────────────────────────── */}
      {/* overflow-hidden: menahan ornamen cahaya sudut (-right-24) supaya nggak
          bikin halaman bisa di-scroll horizontal. */}
      <div className="relative flex w-full flex-col justify-center overflow-hidden px-6 py-10 sm:px-12 lg:w-[31rem] lg:flex-none">
        {/* Ornamen sudut lembut — bikin latar form nggak "kertas kosong". */}
        <div
          aria-hidden
          className="from-sulfur-100/40 pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-radial to-transparent blur-2xl"
        />

        <Link
          href="/"
          className="text-ash-600 hover:text-mineral-700 focus-visible:ring-mineral-500 absolute top-6 left-6 -mx-2 flex w-fit items-center gap-2 rounded px-2 py-1 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none sm:top-8 sm:left-10"
        >
          <ArrowLeft size={14} strokeWidth={1.75} aria-hidden />
          {t('login.backHome')}
        </Link>

        <div className="mx-auto w-full max-w-sm">
          {/* Tiga batang warna logo (moss · mineral · sulfur) — penanda merek
              kecil yang sudah jadi aksen khas halaman ini. */}
          <span aria-hidden className="mb-5 flex h-7 items-end gap-[3px]">
            <span className="bg-moss-400 h-3.5 w-[3px] rounded-full" />
            <span className="bg-mineral-500 h-6 w-[3px] rounded-full" />
            <span className="bg-sulfur-400 h-4.5 w-[3px] rounded-full" />
          </span>

          <h1 className="text-ash-900 font-serif text-[2rem] leading-tight tracking-[-0.02em]">
            {t('login.title')}
          </h1>
          <p className="text-ash-600 mt-2 text-sm">{t('login.subtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <Field
              id="email"
              label={t('login.email')}
              type="email"
              icon={Mail}
              autoComplete="email"
              value={email}
              onChange={setEmail}
            />
            <Field
              id="password"
              label={t('login.password')}
              type={showPassword ? 'text' : 'password'}
              icon={Lock}
              autoComplete="current-password"
              value={password}
              onChange={setPassword}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  className="text-ash-400 hover:text-ash-700 hover:bg-ash-100 focus-visible:ring-mineral-500 flex h-8 w-8 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  {showPassword ? (
                    <EyeOff size={17} strokeWidth={1.75} aria-hidden />
                  ) : (
                    <Eye size={17} strokeWidth={1.75} aria-hidden />
                  )}
                </button>
              }
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
              className={cn(
                'group bg-sulfur-400 text-moss-900 mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[0.95rem] font-semibold shadow-sm',
                'transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                'hover:bg-sulfur-300 active:translate-y-px',
                'focus-visible:ring-sulfur-500 focus-visible:ring-offset-ash-100 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-70',
              )}
            >
              {pending ? (
                <>
                  <LoaderCircle size={17} strokeWidth={2} className="animate-spin" aria-hidden />
                  {t('login.submitting')}
                </>
              ) : (
                <>
                  {t('login.submit')}
                  <ArrowRight
                    size={17}
                    strokeWidth={2}
                    className="transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
