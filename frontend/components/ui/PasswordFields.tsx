'use client';

import { Check, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { passwordChecks } from '@/lib/validation';
import { Input } from './Input';

type Props = {
  password: string;
  confirm: string;
  onPasswordChange: (v: string) => void;
  onConfirmChange: (v: string) => void;
  passwordLabel: string;
  confirmLabel: string;
  passwordError?: string;
  confirmError?: string;
  autoFocus?: boolean;
};

/** Kata sandi baru + konfirmasi, tombol lihat/sembunyikan, dan daftar syarat langsung. */
export function PasswordFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  passwordLabel,
  confirmLabel,
  passwordError,
  confirmError,
  autoFocus,
}: Props) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const checks = passwordChecks(password);
  const items = [
    { ok: checks.length, label: t('validation.ruleLength') },
    { ok: checks.letter, label: t('validation.ruleLetter') },
    { ok: checks.digit, label: t('validation.ruleDigit') },
  ];
  const type = show ? 'text' : 'password';

  return (
    <>
      <div>
        <div className="relative">
          <Input
            label={passwordLabel}
            type={type}
            value={password}
            maxLength={72}
            autoComplete="new-password"
            autoFocus={autoFocus}
            className="pr-11"
            onChange={(e) => onPasswordChange(e.target.value)}
            error={passwordError}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? t('login.hidePassword') : t('login.showPassword')}
            aria-pressed={show}
            className="text-muted hover:text-foreground absolute top-8 right-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-green-700 focus-visible:outline-none"
          >
            {show ? <EyeOff size={16} strokeWidth={1.75} aria-hidden /> : <Eye size={16} strokeWidth={1.75} aria-hidden />}
          </button>
        </div>
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[12px]" aria-label={t('validation.rulesLabel')}>
          {items.map((i) => (
            <li key={i.label} className={cn('flex items-center gap-1', i.ok ? 'text-green-700' : 'text-muted')}>
              <Check size={12} strokeWidth={2.5} className={i.ok ? '' : 'opacity-30'} aria-hidden />
              {i.label}
            </li>
          ))}
        </ul>
      </div>
      <Input
        label={confirmLabel}
        type={type}
        value={confirm}
        maxLength={72}
        autoComplete="new-password"
        onChange={(e) => onConfirmChange(e.target.value)}
        error={confirmError}
      />
    </>
  );
}
