'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useTranslation } from '@/lib/i18n/I18nProvider';

// Demo statis Juli 2026 (Jul 1 = Rabu → 2 sel kosong di depan).
// TODO(FASE 5): tanggal penuh & harga diambil dari API ketersediaan.
const LEADING_BLANKS = 2;
const DAYS_IN_MONTH = 31;
const FULL_DAYS = new Set([5, 6, 12, 13, 26]);
const WEEK = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

export function BookingCalendar() {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(20);

  return (
    <div>
      <div className="text-muted text-xs font-semibold">
        {t('detail.selectDate')} — Juli 2026
      </div>
      <div className="text-muted mt-2.5 grid grid-cols-7 gap-1 text-center text-[11px]">
        {WEEK.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: LEADING_BLANKS }).map((_, i) => (
          <div key={`b${i}`} />
        ))}
        {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map((day) => {
          const isFull = FULL_DAYS.has(day);
          const isSelected = day === selected;
          return (
            <button
              key={day}
              disabled={isFull}
              onClick={() => setSelected(day)}
              className={cn(
                'flex aspect-square items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors',
                isFull && 'cursor-not-allowed text-[#b7b0a0] line-through',
                !isFull && !isSelected && 'text-foreground hover:bg-cream-200',
                isSelected && 'bg-forest-700 text-white',
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="text-muted mt-3 flex gap-3 text-[11px]">
        <span>
          <span className="text-forest-700">▪</span> {selected} {t('detail.selected')}
        </span>
        <span className="text-[#b7b0a0]">▪ {t('detail.full')}</span>
      </div>
    </div>
  );
}
