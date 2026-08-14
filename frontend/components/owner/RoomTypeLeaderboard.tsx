'use client';

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import type { RoomTypePerformance } from '@/lib/data/owner';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';

type SortKey = 'name' | 'totalUnits' | 'bookingsCount' | 'revenue';
type SortDir = 'asc' | 'desc';

/**
 * Header kolom yang bisa diklik buat mengurutkan. Didefinisikan di level modul
 * (bukan di dalam badan `RoomTypeLeaderboard`) — komponen yang dibuat ulang
 * tiap render bikin React melepas & memasang ulang subtree-nya, dan itu yang
 * dicegah aturan lint `react-hooks/static-components`.
 */
function SortHeader({
  label,
  sortBy,
  activeKey,
  dir,
  onSort,
  ariaLabel,
  align = 'left',
}: {
  label: string;
  sortBy: SortKey;
  activeKey: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  ariaLabel: string;
  align?: 'left' | 'right';
}) {
  const activeSort = activeKey === sortBy;
  const Icon = !activeSort ? ChevronsUpDown : dir === 'asc' ? ChevronUp : ChevronDown;
  return (
    <th className={cn('px-2 py-2.5', align === 'right' && 'text-right')}>
      <button
        type="button"
        onClick={() => onSort(sortBy)}
        aria-label={ariaLabel}
        className={cn(
          'hover:text-forest-700 inline-flex items-center gap-1 rounded transition-colors',
          align === 'right' && 'flex-row-reverse',
          activeSort && 'text-forest-700 font-bold',
        )}
      >
        {label}
        <Icon size={12} strokeWidth={2.5} className={cn(!activeSort && 'opacity-40')} aria-hidden />
      </button>
    </th>
  );
}

/**
 * Tabel peringkat performa tipe tenda.
 *
 * Menggantikan pasangan "grafik batang + tabel polos" yang dulu berdampingan:
 * keduanya menampilkan angka pendapatan yang sama persis, cuma beda bentuk.
 * Di sini batangnya masuk ke dalam baris sebagai bar kontribusi, jadi
 * perbandingan visual dan angka pastinya kebaca sekaligus — plus peringkat
 * dan kolom yang bisa diurutkan, yang sebelumnya gak ada sama sekali.
 */
export function RoomTypeLeaderboard({ rows }: { rows: RoomTypePerformance[] }) {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const totalRevenue = rows.reduce((sum, r) => sum + r.revenue, 0);
  const maxRevenue = Math.max(...rows.map((r) => r.revenue), 0);

  const sorted = [...rows].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'name') return a.name.localeCompare(b.name) * dir;
    return (a[sortKey] - b[sortKey]) * dir;
  });

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    // Teks enaknya mulai A→Z, angka enaknya mulai dari yang terbesar.
    setSortDir(key === 'name' ? 'asc' : 'desc');
  }

  /** Prop yang sama buat tiap header sortable — biar JSX-nya gak berulang. */
  const sortProps = { activeKey: sortKey, dir: sortDir, onSort: toggleSort };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead className="text-muted border-b border-[#f0ebe0] text-[11px] uppercase">
          <tr>
            <th className="w-9 px-2 py-2.5 text-center">#</th>
            <SortHeader
              {...sortProps}
              label={t('owner.roomPerfType')}
              sortBy="name"
              ariaLabel={t('owner.sortBy', { column: t('owner.roomPerfType') })}
            />
            <th className="px-2 py-2.5">{t('owner.roomPerfCategory')}</th>
            <SortHeader
              {...sortProps}
              label={t('owner.roomPerfTotalUnits')}
              sortBy="totalUnits"
              align="right"
              ariaLabel={t('owner.sortBy', { column: t('owner.roomPerfTotalUnits') })}
            />
            <SortHeader
              {...sortProps}
              label={t('owner.roomPerfBookings')}
              sortBy="bookingsCount"
              align="right"
              ariaLabel={t('owner.sortBy', { column: t('owner.roomPerfBookings') })}
            />
            <SortHeader
              {...sortProps}
              label={t('owner.roomPerfRevenue')}
              sortBy="revenue"
              align="right"
              ariaLabel={t('owner.sortBy', { column: t('owner.roomPerfRevenue') })}
            />
            <th className="w-40 px-2 py-2.5">{t('owner.roomPerfShare')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0ebe0]">
          {sorted.map((r, i) => {
            const share = totalRevenue > 0 ? (r.revenue / totalRevenue) * 100 : 0;
            const barPct = maxRevenue > 0 ? (r.revenue / maxRevenue) * 100 : 0;
            const idle = r.bookingsCount === 0;
            return (
              <tr key={r.slug} className="group transition-colors hover:bg-[#faf8f3]">
                <td className="px-2 py-2.5 text-center">
                  <span
                    className={cn(
                      'inline-flex h-5.5 w-5.5 items-center justify-center rounded-full text-[10.5px] font-bold tabular-nums',
                      i === 0 && !idle
                        ? 'bg-[#D4A04A] text-white'
                        : 'bg-[#f0ebe0] text-[#8a8274]',
                    )}
                  >
                    {i + 1}
                  </span>
                </td>
                <td
                  className={cn(
                    'px-2 py-2.5 font-semibold',
                    idle ? 'text-[#a09a8c]' : 'text-forest-700',
                  )}
                >
                  {r.name}
                </td>
                <td className="text-muted px-2 py-2.5">{r.category}</td>
                <td className="text-muted px-2 py-2.5 text-right tabular-nums">{r.totalUnits}</td>
                <td
                  className={cn(
                    'px-2 py-2.5 text-right tabular-nums',
                    idle ? 'text-[#c2bcae]' : 'text-muted',
                  )}
                >
                  {r.bookingsCount}
                </td>
                <td
                  className={cn(
                    'px-2 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap',
                    idle && 'text-[#c2bcae] font-normal',
                  )}
                >
                  {idle ? '—' : formatIDR(r.revenue)}
                </td>
                <td className="px-2 py-2.5">
                  {idle ? (
                    <span className="text-[11px] text-[#c2bcae]">
                      {t('owner.noBookingsInPeriod')}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f0ebe0]">
                        <div
                          className={cn(
                            'h-full rounded-full transition-colors',
                            i === 0 ? 'bg-[#D4A04A]' : 'bg-forest-700',
                          )}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <span className="text-muted w-9 shrink-0 text-right text-[11px] tabular-nums">
                        {Math.round(share)}%
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
