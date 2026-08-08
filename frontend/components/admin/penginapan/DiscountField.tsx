'use client';

import { Input } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';

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
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-foreground text-sm font-medium">
          {t('admin.discount')}
        </label>
        <div className="border-border flex gap-0.5 rounded-lg border bg-white p-0.5">
          {(['amount', 'percent'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModeChange(m)}
              className={cn(
                'rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors',
                mode === m
                  ? 'bg-green-700 text-white'
                  : 'text-muted hover:bg-background',
              )}
            >
              {m === 'amount' ? 'Rp' : '%'}
            </button>
          ))}
        </div>
      </div>

      {mode === 'amount' ? (
        <Input
          name="discount"
          type="number"
          min={0}
          value={amount ?? ''}
          onChange={(e) =>
            onAmountChange(
              e.target.value === '' ? null : Number(e.target.value),
            )
          }
        />
      ) : (
        <Input
          name="discountPercent"
          type="number"
          min={0}
          max={100}
          value={percent ?? ''}
          onChange={(e) =>
            onPercentChange(
              e.target.value === '' ? null : Number(e.target.value),
            )
          }
        />
      )}

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
    </div>
  );
}
