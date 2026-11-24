'use client';

import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, Input, PasswordFields } from '@/components/ui';
import { changeOwnPassword } from '@/lib/api/users';
import { useAuth } from '@/lib/auth/AuthProvider';
import { roleHomePath } from '@/lib/auth/roleHome';
import { roleLabelKey } from '@/lib/auth/roleLabel';
import { useRequireRole } from '@/lib/auth/useRequireRole';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { confirmError, errorMessage, passwordError } from '@/lib/validation';

/** Ganti kata sandi sendiri, terbuka untuk semua role yang sudah masuk. */
export function GantiKataSandiPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const { user, isAllowed } = useRequireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN_PENGINAPAN']);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ current?: string; next?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!user || !isAllowed) return <div className="min-h-screen bg-[#f4f1ea]" />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || saving) return;
    setSuccess(false);
    setFormError(null);

    const found: typeof errors = {};
    if (!current) found.current = t('account.password.currentRequired');
    const pwErr = passwordError(next, t, user?.email);
    if (pwErr) found.next = pwErr;
    else if (next === current) found.next = t('account.password.same');
    if (!found.next) {
      const cErr = confirmError(next, confirm, t);
      if (cErr) found.confirm = cErr;
    }
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    try {
      await changeOwnPassword(token, current, next);
      setCurrent('');
      setNext('');
      setConfirm('');
      setSuccess(true);
    } catch (err) {
      setFormError(errorMessage(err, t('account.password.genericError')));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f1ea] px-4 py-8 sm:py-14">
      <div className="mx-auto w-full max-w-md">
        <Link
          href={roleHomePath(user.role)}
          className="text-muted-strong hover:text-foreground -ml-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[13.5px] font-medium focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:outline-none"
        >
          <ArrowLeft size={15} strokeWidth={1.9} aria-hidden />
          {t('account.password.back')}
        </Link>

        <section className="mt-3 rounded-2xl border border-[#ece6d8] bg-white p-5 sm:p-7">
          <h1 className="text-forest-800 font-serif text-[24px] leading-tight font-bold">
            {t('account.password.title')}
          </h1>
          <p className="text-muted mt-1 text-[13px]">
            {user.name} · {t(roleLabelKey(user.role))}
          </p>
          <p className="text-muted mt-3 text-[13.5px] leading-relaxed">{t('account.password.desc')}</p>

          <form onSubmit={(e) => void submit(e)} noValidate className="mt-5 flex flex-col gap-4">
            <Input
              label={t('account.password.current')}
              type="password"
              value={current}
              autoComplete="current-password"
              maxLength={72}
              onChange={(e) => setCurrent(e.target.value)}
              error={errors.current}
            />
            <PasswordFields
              password={next}
              confirm={confirm}
              onPasswordChange={setNext}
              onConfirmChange={setConfirm}
              passwordLabel={t('account.password.new')}
              confirmLabel={t('account.password.confirm')}
              passwordError={errors.next}
              confirmError={errors.confirm}
            />

            {formError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2.5 text-[13px] font-medium text-red-800">
                {formError}
              </p>
            )}
            {success && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-[13px] font-medium text-green-900"
              >
                <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0" aria-hidden />
                {t('account.password.success')}
              </p>
            )}

            <Button type="submit" disabled={saving} fullWidth>
              {saving ? t('account.password.submitting') : t('account.password.submit')}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
