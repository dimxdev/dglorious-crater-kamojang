'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/admin/penginapan/StatusBadge';
import { cn } from '@/lib/cn';
import { effectiveStatus, roomsSummary, statusLabelId } from '@/lib/data/admin';
import {
  bookingsInRange,
  calcOwnerStats,
  calcRecentTransactions,
  calcRevenueByUnit,
  calcRevenueTrend,
  calcUnitRevenue,
  periodRangeLabel,
  type CustomRange,
  type DateRange,
} from '@/lib/data/owner';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { exportReportPdf, OWNER_REPORT_THEME } from '@/lib/pdf/report';
import { DonutChart, RevenueLineChart, UnitBarChart } from './Charts';
import { OwnerLayout, Panel } from './OwnerLayout';
import { RangeFilter } from '@/components/ui';

const COMPARE_LABEL_KEY: Record<DateRange, string> = {
  rangeToday: 'vsYesterday',
  rangeWeek: 'vsLastWeek',
  rangeMonth: 'vsLastMonth',
  rangeCustom: 'vsLastMonth',
};

export function OwnerOverviewPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<DateRange>('rangeMonth');
  const [customRange, setCustomRange] = useState<CustomRange>({ from: '', to: '' });
  const ref = { today: new Date(), custom: customRange };

  const ownerStats = calcOwnerStats(range, ref);
  const revenueTrend = calcRevenueTrend();
  const unitRevenue = calcUnitRevenue(range, ref);
  const revenueByUnit = calcRevenueByUnit(range, ref);
  const recentBookings = calcRecentTransactions(8);

  function handleExport() {
    const unitTotal = revenueByUnit.reduce((sum, u) => sum + u.value, 0);
    const filteredBookings = [...bookingsInRange(range, ref)].sort((a, b) =>
      b.checkIn.localeCompare(a.checkIn),
    );

    exportReportPdf({
      theme: OWNER_REPORT_THEME,
      stats: ownerStats.map((s) => ({
        label: t(`owner.${s.key}`),
        value: s.value,
        deltaText: s.isNew
          ? t('owner.newThisPeriod')
          : `${s.up ? '▲' : '▼'} ${s.delta} ${t(`owner.${COMPARE_LABEL_KEY[range]}`)}`,
        deltaTone: s.isNew ? 'neutral' : s.up ? 'up' : 'down',
      })),
      breakdowns: [
        {
          title: t('owner.revenueByUnit'),
          rows: revenueByUnit.map((u) => ({
            label: u.label,
            pct: unitTotal > 0 ? Math.round((u.value / unitTotal) * 100) : 0,
            valueText: formatIDR(u.revenue ?? 0),
            colorHex: u.color,
          })),
        },
      ],
      table: {
        sectionTitle: t('owner.reportBookingSection'),
        headers: [
          t('admin.tCode'),
          t('admin.tGuest'),
          t('admin.tType'),
          t('admin.tCheckIn'),
          t('admin.tCheckOut'),
          t('admin.tSource'),
          t('admin.tStatus'),
          t('admin.tTotal'),
        ],
        rows: filteredBookings.map((b) => [
          b.kode,
          b.guest,
          roomsSummary(b.rooms),
          b.checkIn,
          b.checkOut,
          b.source === 'WHATSAPP' ? 'WhatsApp' : 'Walk-in',
          statusLabelId[effectiveStatus(b)],
          formatIDR(b.total),
        ]),
        noDataText: t('owner.reportNoBookings'),
        rightAlignColumns: [7],
      },
      labels: {
        documentTitle: t('owner.reportTitle'),
        reportTitle: t('owner.reportTitle'),
        companyName: "D'Glorious Crater Kamojang",
        periodLabel: t('owner.reportPeriod', { period: periodRangeLabel(range, ref) }),
        generatedLabel: t('owner.reportGenerated', {
          date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        }),
        statsSectionTitle: t('owner.reportStatsSection'),
        footerNote: t('owner.reportFooterNote'),
        pageLabel: (page, total) => t('owner.reportPage', { page, total }),
      },
      fileName: `laporan-ringkasan-${periodRangeLabel(range, ref)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.pdf`,
    });
  }

  return (
    <OwnerLayout title={t('owner.title')}>
      {/* Filter + export */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <RangeFilter
          range={range}
          onRangeChange={setRange}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
        <button
          type="button"
          onClick={handleExport}
          className="bg-terracotta-500 hover:bg-terracotta-600 self-start rounded-lg px-5 py-2.5 text-[13.5px] font-semibold text-white"
        >
          {t('owner.export')}
        </button>
      </div>

      {/* Stat cards */}
      <div className="mt-5 grid gap-4.5 sm:grid-cols-2 lg:grid-cols-4">
        {ownerStats.map((s) => (
          <Panel key={s.key}>
            <div className="text-muted text-[13px]">{t(`owner.${s.key}`)}</div>
            <div className="text-forest-700 mt-1.5 font-serif text-[26px] font-extrabold">{s.value}</div>
            {s.isNew ? (
              <div className="mt-1 text-xs font-semibold text-[#8a6d1f]">{t('owner.newThisPeriod')}</div>
            ) : (
              <div
                className={cn('mt-1 text-xs font-semibold', s.up ? 'text-[#2f6b41]' : 'text-[#b23b30]')}
              >
                {s.up ? '▲' : '▼'} {s.delta} {t(`owner.${COMPARE_LABEL_KEY[range]}`)}
              </div>
            )}
          </Panel>
        ))}
      </div>

      {/* Line + bar */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <div className="text-base font-bold">{t('owner.revenueTrend')}</div>
          <RevenueLineChart data={revenueTrend} />
        </Panel>
        <Panel>
          <div className="text-base font-bold">{t('owner.revenuePerUnit')}</div>
          <UnitBarChart bars={unitRevenue} />
          <div className="mt-2 text-center text-[11.5px] text-[#a09a8c]">{t('owner.notActiveYet')}</div>
        </Panel>
      </div>

      {/* Donut + transaksi — breakdown per tipe tenda & sumber booking sekarang
          ada di halaman Penginapan (deep-dive khusus unit itu), donut Ringkasan
          cukup kontribusi lintas 3 unit bisnis (Penginapan/Tiket/Cafe). */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Panel>
          <div className="text-[15px] font-bold">{t('owner.revenueByUnit')}</div>
          <DonutChart segments={revenueByUnit} />
          <div className="mt-2 text-center text-[11.5px] text-[#a09a8c]">{t('owner.notActiveYet')}</div>
        </Panel>
        <Panel>
          <div className="mb-3 text-[15px] font-bold">{t('owner.recentTx')}</div>
          <div className="max-h-[320px] overflow-y-auto">
            <table className="w-full text-left text-[12.5px]">
              <thead className="text-muted text-[10.5px] uppercase">
                <tr>
                  <th className="px-1.5 py-2">{t('owner.txCode')}</th>
                  <th className="px-1.5 py-2">{t('owner.txUnit')}</th>
                  <th className="px-1.5 py-2">{t('owner.txAmount')}</th>
                  <th className="px-1.5 py-2">{t('owner.txStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ebe0]">
                {recentBookings.map((b) => (
                  <tr key={b.kode}>
                    <td className="text-forest-700 px-1.5 py-2.5 font-semibold">{b.kode}</td>
                    <td className="text-muted px-1.5 py-2.5">{roomsSummary(b.rooms)}</td>
                    <td className="px-1.5 py-2.5 font-semibold">{formatIDR(b.total)}</td>
                    <td className="px-1.5 py-2.5">
                      <StatusBadge status={effectiveStatus(b)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </OwnerLayout>
  );
}
