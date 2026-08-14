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
      {/* Padding & ukuran teks dikecilin di mobile supaya 4 tombolnya muat utuh
          di layar 375px — sebelumnya meleber ~33px dan memunculkan scrollbar.
          `overflow-x-auto` tetap dipertahankan sebagai jaring pengaman (bahasa
          lain bisa lebih panjang), tapi batang scrollbar-nya disembunyikan
          lewat `no-scrollbar` karena lebih mengganggu daripada membantu. */}
      <div className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-xl border border-[#e8e2d5] bg-white p-1.5 sm:gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className={cn(
              'shrink-0 rounded-lg px-2.5 py-2 text-[12px] font-semibold whitespace-nowrap transition-colors sm:px-4 sm:text-[13px]',
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
