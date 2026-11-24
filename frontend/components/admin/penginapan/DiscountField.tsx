'use client';

import { cn } from '@/lib/cn';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { clampInt, isBadNumericPaste, parseRupiah, sanitizeDigits } from '@/lib/validation';

function blockBadPaste(e: React.ClipboardEvent<HTMLInputElement>) {
  if (isBadNumericPaste(e.clipboardData.getData('text'))) e.preventDefault();
}

export type DiscountMode = 'amount' | 'percent';

/** Diskon selalu dikirim ke backend sebagai nominal (Rp) — mode persen cuma
 *  kenyamanan input di FE, dikonversi ke nominal di sini sebelum submit,
 *  biar skema/DTO backend gak perlu tahu soal persen sama sekali. */
export function resolveDiscountAmount(
  mode: DiscountMode,
  amount: number | null,
  percent: number | null,
  grossTotal: number,
): number {
  if (mode === 'percent') {
    return Math.round((grossTotal * (percent ?? 0)) / 100);
  }
  return amount ?? 0;
}

type DiscountFieldProps = {
  mode: DiscountMode;
  onModeChange: (mode: DiscountMode) => void;
  amount: number | null;
  onAmountChange: (value: number | null) => void;
  percent: number | null;
  onPercentChange: (value: number | null) => void;
  grossTotal: number;
};

export function DiscountField({
  mode,
  onModeChange,
  amount,
  onAmountChange,
  percent,
  onPercentChange,
  grossTotal,
}: DiscountFieldProps) {
  const { t } = useTranslation();

  return (
    <div>
      <label className="text-foreground mb-1.5 block text-sm font-medium">
        {t('admin.discount')}
      </label>
      <div className="flex">
        <div className="border-input flex shrink-0 items-center gap-0.5 rounded-l-[10px] rounded-r-none border border-r-0 bg-white px-1.5">
          {(['amount', 'percent'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={cn(
                'cursor-pointer rounded-[6px] px-2.5 py-1 text-[11px] font-semibold transition-colors',
                mode === m
                  ? 'bg-green-700 text-white'
                  : 'text-muted hover:bg-stone-100',
              )}
            >
              {m === 'amount' ? 'Rp' : '%'}
            </button>
          ))}
        </div>
        {mode === 'amount' ? (
          <input
            type="text"
            inputMode="numeric"
            value={amount != null ? amount.toLocaleString('id-ID') : ''}
            onPaste={blockBadPaste}
            onChange={(e) => onAmountChange(parseRupiah(e.target.value))}
            className="border-input focus:border-forest-500 focus:ring-forest-500/20 h-11 w-full min-w-0 rounded-l-none rounded-r-[10px] border bg-white px-3.5 text-sm placeholder:text-muted/60 focus:ring-2 focus:outline-none"
          />
        ) : (
          <input
            type="text"
            inputMode="numeric"
            value={percent ?? ''}
            onPaste={blockBadPaste}
            onChange={(e) => {
              const digits = sanitizeDigits(e.target.value, 3);
              onPercentChange(digits === '' ? null : clampInt(Number(digits), 0, 100));
            }}
            className="border-input focus:border-forest-500 focus:ring-forest-500/20 h-11 w-full min-w-0 rounded-l-none rounded-r-[10px] border bg-white px-3.5 text-sm placeholder:text-muted/60 focus:ring-2 focus:outline-none"
          />
        )}
      </div>

      {mode === 'amount' && amount != null && amount > grossTotal && grossTotal > 0 ? (
        <p role="alert" className="mt-1 text-[12px] font-medium text-red-600">
          {t('validation.discountOverTotal', { max: formatIDR(grossTotal) })}
        </p>
      ) : (
        <p className="text-muted mt-1 text-[12px]">
          {mode === 'amount'
            ? amount && amount > 0 && grossTotal > 0
              ? t('admin.discountPercentEquivalent', {
                  percent: ((amount / grossTotal) * 100).toFixed(1),
                })
              : t('admin.discountHint')
            : percent && percent > 0
              ? t('admin.discountAmountEquivalent', {
                  amount: formatIDR(Math.round((grossTotal * percent) / 100)),
                })
              : t('admin.discountHintPercent')}
        </p>
      )}
    </div>
  );
}
