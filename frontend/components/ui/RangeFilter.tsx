'use client';

import { cn } from '@/lib/cn';
import type { CustomRange, DateRange } from '@/lib/data/owner';
import { useTranslation } from '@/lib/i18n/I18nProvider';

const RANGES: DateRange[] = ['rangeToday', 'rangeWeek', 'rangeMonth', 'rangeCustom'];

type RangeFilterProps = {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  customRange: CustomRange;
  onCustomRangeChange: (custom: CustomRange) => void;
};

/** Filter rentang tanggal dipakai bareng lintas dashboard (Owner: Ringkasan &
 *  Penginapan; Admin: Data Booking) — biar polanya konsisten di mana-mana. */
export function RangeFilter({ range, onRangeChange, customRange, onCustomRangeChange }: RangeFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* overflow-x-auto: kalau layar sempit gak muat 4 tombol, geser ke samping
          daripada tombolnya kepotong/wrap acak-acakan di tengah kata. */}
      <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-[#e8e2d5] bg-white p-1.5">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={cn(
              'shrink-0 rounded-lg px-4 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors',
              range === r ? 'bg-forest-700 text-white' : 'text-muted',
            )}
          >
            {t(`common.${r}`)}
          </button>
        ))}
      </div>
      {range === 'rangeCustom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customRange.from}
            onChange={(e) => onCustomRangeChange({ ...customRange, from: e.target.value })}
            className="border-input rounded-[10px] border bg-white px-3 py-2 text-[13px]"
          />
          <span className="text-muted text-xs">–</span>
          <input
            type="date"
            value={customRange.to}
            onChange={(e) => onCustomRangeChange({ ...customRange, to: e.target.value })}
            className="border-input rounded-[10px] border bg-white px-3 py-2 text-[13px]"
          />
        </div>
      )}
    </div>
  );
}
