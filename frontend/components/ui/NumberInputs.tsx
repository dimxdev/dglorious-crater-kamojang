'use client';

import { useState } from 'react';
import { clampInt, isBadNumericPaste, parseRupiah, sanitizeDigits } from '@/lib/validation';
import { Input } from './Input';

type BaseProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type' | 'min' | 'max'
> & { label?: string; error?: string };

function blockBadPaste(e: React.ClipboardEvent<HTMLInputElement>) {
  if (isBadNumericPaste(e.clipboardData.getData('text'))) e.preventDefault();
}

/** Bilangan bulat dengan batas min/max; hanya digit yang diterima. */
export function IntInput({
  value,
  min,
  max,
  onValueChange,
  ...rest
}: BaseProps & {
  value: number;
  min: number;
  max: number;
  onValueChange: (n: number) => void;
}) {
  // Draft menjaga kolom bisa dikosongkan sementara saat mengetik.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={draft ?? String(value)}
      onPaste={blockBadPaste}
      onChange={(e) => {
        const digits = sanitizeDigits(e.target.value, String(max).length);
        if (digits === '') {
          setDraft('');
          return;
        }
        const n = clampInt(Number(digits), min, max);
        setDraft(String(n));
        onValueChange(n);
      }}
      onBlur={() => {
        if (draft === '') onValueChange(min);
        setDraft(null);
      }}
    />
  );
}

/** Rupiah bulat (0 s/d 1.000.000.000) dengan pemisah ribuan; null = kosong. */
export function RupiahInput({
  value,
  onValueChange,
  ...rest
}: BaseProps & {
  value: number | null;
  onValueChange: (n: number | null) => void;
}) {
  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value != null ? value.toLocaleString('id-ID') : ''}
      onPaste={blockBadPaste}
      onChange={(e) => onValueChange(parseRupiah(e.target.value))}
    />
  );
}
