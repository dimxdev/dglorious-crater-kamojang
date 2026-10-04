'use client';

import { Download } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api/client';
import { fetchAdminBookings, toAdminBooking } from '@/lib/api/bookings';
import { fetchAdminRoomTypes } from '@/lib/api/roomTypes';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { AdminBooking } from '@/lib/data/admin';
import {
  calcBookingByType,
  calcBySource,
  calcPenginapanStats,
  calcRoomTypePerformance,
  periodRangeLabel,
  type CustomRange,
  type DateRange,
  type OwnerRoomSummary,
} from '@/lib/data/owner';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { exportReportPdf, OWNER_REPORT_THEME } from '@/lib/pdf/report';
import { DonutChart } from './Charts';
import { OwnerLayout, Panel } from './OwnerLayout';
import { StatCard, TopTypeCard } from './OwnerStats';
import { RoomTypeLeaderboard } from './RoomTypeLeaderboard';
import { RangeFilter } from '@/components/ui';

const COMPARE_LABEL_KEY: Record<DateRange, string> = {
  rangeToday: 'vsYesterday',
  rangeWeek: 'vsLastWeek',
  rangeMonth: 'vsLastMonth',
  rangeCustom: 'vsLastMonth',
};

/**
 * Performa tiap tipe tenda/villa — level bisnis (Owner), bukan operasional.
 * CRUD tenda & booking harian tetap di menu Admin (PROJECT.md: Owner bisa
 * masuk "ke bawah" ke dashboard Admin, cukup link ke sana, bukan duplikat UI).
 */
export function OwnerPenginapanPage() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [range, setRange] = useState<DateRange>('rangeMonth');
  const [customRange, setCustomRange] = useState<CustomRange>({ from: '', to: '' });
  const ref = { today: new Date(), custom: customRange };

  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [rooms, setRooms] = useState<OwnerRoomSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setLoadError(null);
      const [bookingList, roomTypes] = await Promise.all([
        fetchAdminBookings(token),
        fetchAdminRoomTypes(token),
      ]);
      setBookings(bookingList.map(toAdminBooking));
      setRooms(roomTypes.filter((r) => r.isActive));
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : t('admin.loadError'));
    }
  }, [token, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loadError) {
    return (
      <OwnerLayout title={t('owner.navPenginapan')}>
        <div className="rounded-2xl border border-[#e8e2d5] bg-white px-4 py-8 text-center">
          <p className="text-sm text-red-600">{loadError}</p>
          <button
            onClick={() => void refresh()}
            className="text-accent mt-2 text-sm font-semibold underline"
          >
            {t('admin.retry')}
          </button>
        </div>
      </OwnerLayout>
    );
  }

  if (bookings === null || rooms === null) {
    return (
      <OwnerLayout title={t('owner.navPenginapan')}>
        <div className="text-muted rounded-2xl border border-[#e8e2d5] bg-white px-4 py-8 text-center text-sm">
          {t('admin.loading')}
        </div>
      </OwnerLayout>
    );
  }

  const performance = calcRoomTypePerformance(bookings, rooms, range, ref);
  const bookingByType = calcBookingByType(bookings, rooms, range, ref);
  const bySource = calcBySource(bookings, range, ref);
  const stats = calcPenginapanStats(bookings, range, ref);
  const compareLabel = t(`owner.${COMPARE_LABEL_KEY[range]}`);
  const newLabel = t('owner.newThisPeriod');

  // Total dari `stats` (dihitung langsung dari booking), bukan penjumlahan
  // `performance` yang tiap tipenya sudah dibulatkan sendiri-sendiri.
  const totalRevenue = stats.revenue.raw;
  const totalBookings = stats.bookings.raw;
  const topType = performance.reduce<(typeof performance)[number] | null>(
    (best, r) => (r.bookingsCount > 0 && (!best || r.revenue > best.revenue) ? r : best),
    null,
  );

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
            className="bg-terracotta-500 hover:bg-terracotta-600 inline-flex items-center gap-2 self-start rounded-lg px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors"
          >
            <Download size={15} strokeWidth={2.2} aria-hidden />
            {t('owner.export')}
          </button>
        </div>
      </div>

      {/* 2 kolom sejak mobile (2×2), baru memanjang jadi 4 kolom di layar lebar. */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4.5 xl:grid-cols-4">
        <StatCard
          stat={stats.revenue}
          label={t('owner.statRevenue')}
          compareLabel={compareLabel}
          newLabel={newLabel}
        />
        <StatCard
          stat={stats.bookings}
          label={t('owner.statBooking')}
          compareLabel={compareLabel}
          newLabel={newLabel}
        />
        <StatCard
          stat={stats.avgPerBooking}
          label={t('owner.statAvgPerBooking')}
          compareLabel={compareLabel}
          newLabel={newLabel}
        />
        <TopTypeCard
          label={t('owner.statTopType')}
          name={topType?.name ?? null}
          category={topType?.category}
          revenueText={topType ? formatIDR(topType.revenue) : undefined}
          sharePct={
            topType && totalRevenue > 0
              ? Math.round((topType.revenue / totalRevenue) * 100)
              : undefined
          }
          shareLabel={t('owner.ofTotalRevenue')}
          emptyText={t('owner.noBookingsInPeriod')}
        />
      </div>

      <div className="mt-4.5 grid gap-4.5 sm:grid-cols-2">
        <Panel>
          <div className="text-[15px] font-bold">{t('owner.bookingByType')}</div>
          <DonutChart
            segments={bookingByType}
            centerLabel={t('owner.donutCenterBookings')}
            centerUnit="count"
          />
        </Panel>
        <Panel>
          <div className="text-[15px] font-bold">{t('owner.onlineVsWalkin')}</div>
          <DonutChart
            segments={bySource}
            centerLabel={t('owner.donutCenterBookings')}
            centerUnit="count"
          />
        </Panel>
      </div>

      <Panel className="mt-4.5">
        <div className="mb-3.5 flex items-center justify-between gap-3">
          <div className="text-[15px] font-bold">{t('owner.roomPerfTitle')}</div>
          <Link
            href="/admin/penginapan/booking"
            className="text-accent inline-flex items-center gap-1 text-[13px] font-semibold hover:underline"
          >
            {t('owner.viewBookingDetailCta')}
          </Link>
        </div>
        <RoomTypeLeaderboard rows={performance} />
        <p className="text-muted mt-3 text-[11.5px]">{t('owner.roomPerfApproxNote')}</p>
      </Panel>
    </OwnerLayout>
  );
}
