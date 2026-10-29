'use client';

import { ArrowUpRight, Download } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { StatusBadge } from '@/components/admin/penginapan/StatusBadge';
import { ApiError } from '@/lib/api/client';
import { fetchAdminBookings, toAdminBooking } from '@/lib/api/bookings';
import { fetchAdminRoomTypes } from '@/lib/api/roomTypes';
import { useAuth } from '@/lib/auth/AuthProvider';
import { effectiveStatus, roomsSummary, statusLabelId, type AdminBooking } from '@/lib/data/admin';
import {
  bookingsInRange,
  calcOwnerStats,
  calcRecentTransactions,
  calcRevenueTrend,
  calcStatSparklines,
  periodRangeLabel,
  totalCapacity,
  type CustomRange,
  type DateRange,
  type OwnerRoomSummary,
  type OwnerStatKey,
} from '@/lib/data/owner';
import { formatDate, formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { exportReportPdf, OWNER_REPORT_THEME } from '@/lib/pdf/report';
import { RevenueLineChart } from './Charts';
import { OwnerLayout, Panel } from './OwnerLayout';
import { HeroRevenueCard, OccupancyCard, StatCard } from './OwnerStats';
import { RangeFilter } from '@/components/ui';

const COMPARE_LABEL_KEY: Record<DateRange, string> = {
  rangeToday: 'vsYesterday',
  rangeWeek: 'vsLastWeek',
  rangeMonth: 'vsLastMonth',
  rangeCustom: 'vsLastMonth',
};

export function OwnerOverviewPage() {
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
      <OwnerLayout title={t('owner.title')}>
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
      <OwnerLayout title={t('owner.title')}>
        <div className="text-muted rounded-2xl border border-[#e8e2d5] bg-white px-4 py-8 text-center text-sm">
          {t('admin.loading')}
        </div>
      </OwnerLayout>
    );
  }

  // Alias biar TS tetap narrow ke non-null di dalam closure `handleExport` di
  // bawah (nested function scope tidak ikut narrowing pengecekan di atas).
  const bookingsData = bookings;
  const ownerStats = calcOwnerStats(bookingsData, rooms, range, ref);
  const sparklines = calcStatSparklines(bookings, rooms, range, ref);
  const revenueTrend = calcRevenueTrend(bookings);
  const recentBookings = calcRecentTransactions(bookings, 8);
  const periodLabel = periodRangeLabel(range, ref);
  const compareLabel = t(`owner.${COMPARE_LABEL_KEY[range]}`);
  const newLabel = t('owner.newThisPeriod');

  // Diambil per-key (bukan lewat urutan array) supaya kartu tetap benar kalau
  // suatu saat urutan/isi `calcOwnerStats` berubah.
  const byKey = Object.fromEntries(ownerStats.map((s) => [s.key, s])) as Record<
    OwnerStatKey,
    (typeof ownerStats)[number]
  >;

  function handleExport() {
    const filteredBookings = [...bookingsInRange(bookingsData, range, ref)].sort((a, b) =>
      b.checkIn.localeCompare(a.checkIn),
    );

    exportReportPdf({
      theme: OWNER_REPORT_THEME,
      stats: ownerStats.map((s) => ({
        label: t(`owner.${s.key}`),
        value: s.value,
        deltaText: s.isNew
          ? t('owner.newThisPeriod')
          : // ▲/▼ tidak ada di font standar jsPDF (tercetak rusak) — pakai tanda ASCII.
            `${s.up ? '+' : '-'}${s.delta} ${t(`owner.${COMPARE_LABEL_KEY[range]}`)}`,
        deltaTone: s.isNew ? 'neutral' : s.up ? 'up' : 'down',
      })),
      breakdowns: [],
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
          className="bg-terracotta-500 hover:bg-terracotta-600 inline-flex items-center gap-2 self-start rounded-lg px-5 py-2.5 text-[13.5px] font-semibold text-white transition-colors"
        >
          <Download size={15} strokeWidth={2.2} aria-hidden />
          {t('owner.export')}
        </button>
      </div>

      {/* Pendapatan tampil sebagai kartu utama (gelap, besar) — angka yang
          paling dicari Owner; tiga metrik lain jadi kartu pendamping. */}
      <div className="mt-5 grid gap-3 sm:gap-4.5 lg:grid-cols-[1.35fr_1fr]">
        <HeroRevenueCard
          stat={byKey.statRevenue}
          label={t('owner.statRevenue')}
          periodLabel={periodLabel}
          compareLabel={compareLabel}
          newLabel={newLabel}
          sparkline={sparklines.statRevenue}
        />
        {/* 2 kolom sejak mobile — sebagai kartu selebar layar angkanya jadi
            terlalu dominan dan halamannya kepanjangan buat di-scroll. */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4.5">
          <StatCard
            stat={byKey.statBooking}
            label={t('owner.statBooking')}
            compareLabel={compareLabel}
            newLabel={newLabel}
            sparkline={sparklines.statBooking}
          />
          <StatCard
            stat={byKey.statVisitors}
            label={t('owner.statVisitors')}
            compareLabel={compareLabel}
            newLabel={newLabel}
            sparkline={sparklines.statVisitors}
          />
        </div>
      </div>

      <div className="mt-4.5 grid gap-4.5 lg:grid-cols-[1.35fr_1fr]">
        <Panel>
          <div className="flex items-baseline justify-between gap-3">
            <div className="text-base font-bold">{t('owner.revenueTrend')}</div>
            {/* Disembunyikan di mobile: teksnya soal kursor, sementara di sana
                grafiknya dioperasikan dengan sentuhan — sekalian ngasih ruang
                buat judul yang kalau tidak begitu jadi ikut terpotong 2 baris. */}
            <div className="text-muted hidden text-[11.5px] sm:block">{t('owner.chartHint')}</div>
          </div>
          <RevenueLineChart data={revenueTrend} />
        </Panel>
        <OccupancyCard
          stat={byKey.statOccupancy}
          label={t('owner.statOccupancy')}
          compareLabel={compareLabel}
          newLabel={newLabel}
          capacityNote={t('owner.occupancyOf', { units: totalCapacity(rooms) })}
        />
      </div>

      {/* Tabel dikasih baris sendiri selebar halaman — waktu dia diapit dua
          panel grafik, kolom "Tipe Tenda" kepaksa wrap 3 baris dan malah susah
          dibaca. Lebar penuh sekalian muat kolom tamu & tanggal check-in. */}
      <Panel className="mt-4.5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-[15px] font-bold">{t('owner.recentTx')}</div>
          <Link
            href="/admin/penginapan/booking"
            className="text-accent inline-flex items-center gap-1 text-[12.5px] font-semibold hover:underline"
          >
            {t('owner.seeAll')}
            <ArrowUpRight size={13} strokeWidth={2.4} aria-hidden />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12.5px]">
            <thead className="text-muted text-[10.5px] uppercase">
              <tr>
                <th className="px-1.5 py-2 font-semibold">{t('owner.txCode')}</th>
                <th className="px-1.5 py-2 font-semibold">{t('admin.tGuest')}</th>
                <th className="px-1.5 py-2 font-semibold">{t('owner.txUnit')}</th>
                <th className="px-1.5 py-2 font-semibold">{t('admin.tCheckIn')}</th>
                <th className="px-1.5 py-2 text-right font-semibold">{t('owner.txAmount')}</th>
                <th className="px-1.5 py-2 font-semibold">{t('owner.txStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0ebe0]">
              {recentBookings.map((b) => (
                <tr key={b.kode} className="transition-colors hover:bg-[#faf8f3]">
                  <td className="text-forest-700 px-1.5 py-2.5 font-semibold whitespace-nowrap">
                    {b.kode}
                  </td>
                  <td className="px-1.5 py-2.5">{b.guest}</td>
                  <td className="text-muted px-1.5 py-2.5">{roomsSummary(b.rooms)}</td>
                  <td className="text-muted px-1.5 py-2.5 whitespace-nowrap">
                    {formatDate(b.checkIn)}
                  </td>
                  <td className="px-1.5 py-2.5 text-right font-semibold tabular-nums whitespace-nowrap">
                    {formatIDR(b.total)}
                  </td>
                  <td className="px-1.5 py-2.5">
                    <StatusBadge status={effectiveStatus(b)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </OwnerLayout>
  );
}
