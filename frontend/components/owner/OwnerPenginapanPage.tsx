'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  calcBookingByType,
  calcBySource,
  calcRoomTypePerformance,
  periodRangeLabel,
  type CustomRange,
  type DateRange,
} from '@/lib/data/owner';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { exportReportPdf, OWNER_REPORT_THEME } from '@/lib/pdf/report';
import { DonutChart, UnitBarChart } from './Charts';
import { OwnerLayout, Panel } from './OwnerLayout';
import { RangeFilter } from '@/components/ui';

/**
 * Performa tiap tipe tenda/villa — level bisnis (Owner), bukan operasional.
 * CRUD tenda & booking harian tetap di menu Admin (PROJECT.md: Owner bisa
 * masuk "ke bawah" ke dashboard Admin, cukup link ke sana, bukan duplikat UI).
 */
export function OwnerPenginapanPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<DateRange>('rangeMonth');
  const [customRange, setCustomRange] = useState<CustomRange>({ from: '', to: '' });
  const ref = { today: new Date(), custom: customRange };

  const performance = calcRoomTypePerformance(range, ref);
  const bookingByType = calcBookingByType(range, ref);
  const bySource = calcBySource(range, ref);
  const totalRevenue = performance.reduce((sum, r) => sum + r.revenue, 0);
  const totalBookings = performance.reduce((sum, r) => sum + r.bookingsCount, 0);
  // Nominal dikonversi ke "juta" biar konsisten sama UnitBarChart yang
  // dipakai di Ringkasan (lihat OwnerOverviewPage.tsx).
  const revenueBars = performance.map((r) => ({
    label: r.name,
    value: Math.round(r.revenue / 1_000_000),
    active: true,
  }));

  function toBreakdownRows(segments: typeof bookingByType) {
    const total = segments.reduce((sum, s) => sum + s.value, 0);
    return segments.map((s) => ({
      label: s.label,
      pct: total > 0 ? Math.round((s.value / total) * 100) : 0,
      valueText: formatIDR(s.revenue ?? 0),
      colorHex: s.color,
    }));
  }

  function handleExport() {
    exportReportPdf({
      theme: OWNER_REPORT_THEME,
      stats: [
        { label: t('owner.statRevenue'), value: formatIDR(totalRevenue), deltaText: '', deltaTone: 'neutral' },
        { label: t('owner.statBooking'), value: String(totalBookings), deltaText: '', deltaTone: 'neutral' },
      ],
      breakdowns: [
        { title: t('owner.bookingByType'), rows: toBreakdownRows(bookingByType) },
        { title: t('owner.onlineVsWalkin'), rows: toBreakdownRows(bySource) },
      ],
      table: {
        sectionTitle: t('owner.roomPerfTitle'),
        headers: [
          t('owner.roomPerfType'),
          t('owner.roomPerfCategory'),
          t('owner.roomPerfTotalUnits'),
          t('owner.roomPerfBookings'),
          t('owner.roomPerfRevenue'),
        ],
        rows: performance.map((r) => [
          r.name,
          r.category,
          String(r.totalUnits),
          String(r.bookingsCount),
          formatIDR(r.revenue),
        ]),
        noDataText: t('owner.reportNoBookings'),
        rightAlignColumns: [4],
      },
      labels: {
        documentTitle: t('owner.reportTitlePenginapan'),
        reportTitle: t('owner.reportTitlePenginapan'),
        companyName: "D'Glorious Crater Kamojang",
        periodLabel: t('owner.reportPeriod', { period: periodRangeLabel(range, ref) }),
        generatedLabel: t('owner.reportGenerated', {
          date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        }),
        statsSectionTitle: t('owner.reportStatsSection'),
        footerNote: t('owner.reportFooterNote'),
        pageLabel: (page, total) => t('owner.reportPage', { page, total }),
      },
      fileName: `laporan-penginapan-${periodRangeLabel(range, ref)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.pdf`,
    });
  }

  return (
    <OwnerLayout title={t('owner.navPenginapan')}>
      <div className="flex flex-col gap-3.5">
        <p className="text-muted hidden max-w-140 text-[13.5px] md:block">
          {t('owner.penginapanSubtitle')}
        </p>
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
      </div>

      <div className="mt-5 grid gap-4.5 sm:grid-cols-2">
        <Panel>
          <div className="text-muted text-[13px]">{t('owner.statRevenue')}</div>
          <div className="text-forest-700 mt-1.5 font-serif text-[26px] font-extrabold">
            {formatIDR(totalRevenue)}
          </div>
        </Panel>
        <Panel>
          <div className="text-muted text-[13px]">{t('owner.statBooking')}</div>
          <div className="text-forest-700 mt-1.5 font-serif text-[26px] font-extrabold">
            {totalBookings}
          </div>
        </Panel>
      </div>

      <Panel className="mt-5">
        <div className="text-[15px] font-bold">{t('owner.roomPerfRevenueChart')}</div>
        <UnitBarChart bars={revenueBars} />
      </Panel>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <Panel>
          <div className="text-[15px] font-bold">{t('owner.bookingByType')}</div>
          <DonutChart segments={bookingByType} />
        </Panel>
        <Panel>
          <div className="text-[15px] font-bold">{t('owner.onlineVsWalkin')}</div>
          <DonutChart segments={bySource} />
        </Panel>
      </div>

      <Panel className="mt-5">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="text-[15px] font-bold">{t('owner.roomPerfTitle')}</div>
          <Link href="/admin/penginapan/booking" className="text-accent text-[13px] font-semibold">
            {t('owner.viewBookingDetailCta')}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="text-muted border-b border-[#f0ebe0] text-[11px] uppercase">
              <tr>
                <th className="px-2 py-2.5">{t('owner.roomPerfType')}</th>
                <th className="px-2 py-2.5">{t('owner.roomPerfCategory')}</th>
                <th className="px-2 py-2.5">{t('owner.roomPerfTotalUnits')}</th>
                <th className="px-2 py-2.5">{t('owner.roomPerfBookings')}</th>
                <th className="px-2 py-2.5">{t('owner.roomPerfRevenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ebe0]">
              {performance.map((r) => (
                <tr key={r.slug}>
                  <td className="text-forest-700 px-2 py-2.5 font-semibold">{r.name}</td>
                  <td className="text-muted px-2 py-2.5">{r.category}</td>
                  <td className="text-muted px-2 py-2.5">{r.totalUnits}</td>
                  <td className="text-muted px-2 py-2.5">{r.bookingsCount}</td>
                  <td className="px-2 py-2.5 font-semibold">{formatIDR(r.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-muted mt-3 text-[11.5px]">{t('owner.roomPerfApproxNote')}</p>
      </Panel>
    </OwnerLayout>
  );
}
