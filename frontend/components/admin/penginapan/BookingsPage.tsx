'use client';

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Search,
  SearchX,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  RangeFilter,
  TBody,
  Td,
  Th,
  THead,
  Table,
  Tr,
} from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import {
  fetchAdminBookings,
  updateBookingStatus,
  type BookingStatusUpdate,
} from '@/lib/api/bookings';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import {
  roomsSummary,
  roomsSummaryShort,
  statusLabelId,
  type BookingChannel,
  type BookingStatus,
} from '@/lib/data/admin';
import {
  bookingsInRange,
  periodRangeLabel,
  type CustomRange,
  type DateRange,
} from '@/lib/data/owner';
import { exportBookingExcel } from '@/lib/excel/bookingReport';
import { formatDate, formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ADMIN_REPORT_THEME, exportReportPdf } from '@/lib/pdf/report';
import {
  BookingDetailModal,
  displayStatus,
  toDisplay,
  type DisplayBooking,
} from './BookingDetailModal';
import { SourceBadge, StatusBadge } from './StatusBadge';

// Warna breakdown status/sumber di PDF — samain sama nuansa StatusBadge/SourceBadge di layar.
const STATUS_COLORS: Record<BookingStatus, string> = {
  DP: '#c8952e',
  LUNAS: '#2c5a8a',
  CHECKED_IN: '#2f6b41',
  COMPLETED: '#1B4332',
  HANGUS: '#b23b30',
  NO_SHOW: '#c15f1e',
};
const SOURCE_COLORS: Record<BookingChannel, string> = {
  WHATSAPP: '#2c5a8a',
  WALK_IN: '#C1663F',
};

// Dot per status buat pill filter — dicocokin sama `dotTones` di Badge.tsx biar
// warna yang sama dipakai di filter maupun di kolom Status tabel.
const STATUS_DOTS: Record<BookingStatus, string> = {
  DP: 'bg-orange-400',
  LUNAS: 'bg-blue-500',
  CHECKED_IN: 'bg-green-600',
  COMPLETED: 'bg-green-800',
  HANGUS: 'bg-red-500',
  NO_SHOW: 'bg-orange-600',
};

const STATUSES = Object.keys(statusLabelId) as BookingStatus[];
const SOURCES: BookingChannel[] = ['WHATSAPP', 'WALK_IN'];
const PAGE_SIZE = 20;

export function BookingsPage() {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [bookings, setBookings] = useState<DisplayBooking[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedKode, setSelectedKode] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<BookingChannel | ''>('');
  // Rentang periode (Hari Ini/Minggu Ini/Bulan Ini/Custom) — sama pola kayak
  // dashboard Owner, TIDAK BISA dikosongkan (jangan sampai defaultnya nampilin
  // semua data sekaligus kalau datanya udah numpuk berbulan-bulan). Ini yang
  // nentuin isi Export PDF.
  const [range, setRange] = useState<DateRange>('rangeMonth');
  const [customRange, setCustomRange] = useState<CustomRange>({
    from: '',
    to: '',
  });
  // Filter tambahan buat cari 1 tanggal check-in spesifik dgn cepat — cuma
  // mempersempit tabel di layar, sengaja TIDAK ikut ke Export PDF (PDF tetap
  // ngikutin rentang periode di atas, biar laporannya konsisten per periode).
  const [checkInDate, setCheckInDate] = useState('');
  const [page, setPage] = useState(1);

  const refreshList = useCallback(async () => {
    if (!token) return;
    try {
      setListError(null);
      const data = await fetchAdminBookings(token);
      setBookings(data.map(toDisplay));
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : t('common.loadError'));
    }
  }, [token, t]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  const ref = { today: new Date(), custom: customRange };
  const all = bookings ?? [];

  const selected = all.find((b) => b.kode === selectedKode) ?? null;

  const searchActive = search.trim() !== '';
  const q = search.trim().toLowerCase();
  // Scope dasar: begitu ngetik di search, cari di SEMUA booking (abaikan
  // periode) — biar gampang nemuin booking lama tanpa nebak-nebak periodenya.
  // Status & sumber TETAP berlaku, jadi hasil pencarian masih bisa dipersempit.
  const scoped = searchActive
    ? all.filter(
        (b) =>
          b.kode.toLowerCase().includes(q) ||
          b.guest.toLowerCase().includes(q) ||
          b.wa.toLowerCase().includes(q),
      )
    : bookingsInRange(range, ref, all);

  const matchesStatus = (b: DisplayBooking) =>
    statusFilter === '' || displayStatus(b) === statusFilter;
  const matchesSource = (b: DisplayBooking) =>
    sourceFilter === '' || b.source === sourceFilter;

  // Angka di pill = "berapa hasilnya kalau pill ini diklik", jadi masing-masing
  // dihitung dengan mengabaikan filternya sendiri (status ngabaikan status, dst).
  const scopedForStatus = scoped.filter(matchesSource);
  const scopedForSource = scoped.filter(matchesStatus);
  const statusCount = (s: BookingStatus) =>
    scopedForStatus.filter((b) => displayStatus(b) === s).length;
  const sourceCount = (src: BookingChannel) =>
    scopedForSource.filter((b) => b.source === src).length;

  const exportBookings = scoped.filter((b) => matchesStatus(b) && matchesSource(b));
  const filtered = exportBookings.filter(
    (b) => checkInDate === '' || b.checkIn === checkInDate,
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const anyFilterActive =
    searchActive ||
    statusFilter !== '' ||
    sourceFilter !== '' ||
    checkInDate !== '';

  function resetFilters() {
    setSearch('');
    setStatusFilter('');
    setSourceFilter('');
    setCheckInDate('');
    setPage(1);
  }

  // Angka ringkasan yang sama dipakai buat strip statistik di layar, Export PDF,
  // maupun Export Excel — biar semuanya konsisten (gak ada logic ganda yang
  // bisa ketinggalan sinkron).
  function buildExportSummary() {
    const totalRevenue = exportBookings.reduce((sum, b) => sum + b.total, 0);
    const belumLunas = exportBookings.filter(
      (b) => displayStatus(b) === 'DP',
    ).length;
    const menginap = exportBookings.filter(
      (b) => displayStatus(b) === 'CHECKED_IN',
    ).length;

    const statusCounts = new Map<BookingStatus, number>();
    exportBookings.forEach((b) => {
      const s = displayStatus(b);
      statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
    });
    const statusBreakdown = STATUSES.filter(
      (s) => (statusCounts.get(s) ?? 0) > 0,
    ).map((s) => ({
      label: statusLabelId[s],
      count: statusCounts.get(s) ?? 0,
      pct:
        exportBookings.length > 0
          ? Math.round(
              ((statusCounts.get(s) ?? 0) / exportBookings.length) * 100,
            )
          : 0,
      colorHex: STATUS_COLORS[s],
    }));

    const sourceCounts: Record<BookingChannel, number> = {
      WHATSAPP: 0,
      WALK_IN: 0,
    };
    exportBookings.forEach((b) => {
      sourceCounts[b.source] += 1;
    });
    const sourceBreakdown = SOURCES.map((src) => ({
      label: src === 'WHATSAPP' ? t('admin.whatsapp') : t('admin.walkin'),
      count: sourceCounts[src],
      pct:
        exportBookings.length > 0
          ? Math.round((sourceCounts[src] / exportBookings.length) * 100)
          : 0,
      colorHex: SOURCE_COLORS[src],
    }));

    return {
      totalRevenue,
      belumLunas,
      menginap,
      statusBreakdown,
      sourceBreakdown,
      periodLabel: periodRangeLabel(range, ref),
    };
  }

  const summary = buildExportSummary();

  function handleExport() {
    const {
      totalRevenue,
      belumLunas,
      menginap,
      statusBreakdown,
      sourceBreakdown,
      periodLabel,
    } = buildExportSummary();
    const statusRows = statusBreakdown.map((s) => ({
      label: s.label,
      pct: s.pct,
      valueText: String(s.count),
      colorHex: s.colorHex,
    }));
    const sourceRows = sourceBreakdown.map((s) => ({
      label: s.label,
      pct: s.pct,
      valueText: String(s.count),
      colorHex: s.colorHex,
    }));

    exportReportPdf({
      theme: ADMIN_REPORT_THEME,
      stats: [
        {
          label: t('admin.reportStatTotalBooking'),
          value: String(exportBookings.length),
          deltaText: '',
          deltaTone: 'neutral',
        },
        {
          label: t('admin.reportStatTotalRevenue'),
          value: formatIDR(totalRevenue),
          deltaText: '',
          deltaTone: 'neutral',
        },
        {
          label: t('admin.reportStatBelumLunas'),
          value: String(belumLunas),
          deltaText: '',
          deltaTone: 'neutral',
        },
        {
          label: t('admin.reportStatMenginap'),
          value: String(menginap),
          deltaText: '',
          deltaTone: 'neutral',
        },
      ],
      breakdowns: [
        { title: t('admin.reportStatusBreakdown'), rows: statusRows },
        { title: t('admin.reportSourceBreakdown'), rows: sourceRows },
      ],
      table: {
        sectionTitle: t('admin.reportBookingSection'),
        headers: [
          t('admin.tCode'),
          t('admin.tGuest'),
          t('admin.tWa'),
          t('admin.tType'),
          t('admin.tBookingDate'),
          t('admin.tCheckIn'),
          t('admin.tCheckOut'),
          t('admin.tSource'),
          t('admin.tTotal'),
          t('admin.tStatus'),
        ],
        rows: exportBookings.map((b) => [
          b.kode,
          b.guest,
          b.wa,
          roomsSummaryShort(b.rooms),
          formatDate(b.createdAt),
          formatDate(b.checkIn),
          formatDate(b.checkOut),
          b.source === 'WHATSAPP' ? t('admin.whatsapp') : t('admin.walkin'),
          formatIDR(b.total),
          statusLabelId[displayStatus(b)],
        ]),
        noDataText: t('admin.reportNoBookings'),
        rightAlignColumns: [8],
      },
      labels: {
        documentTitle: t('admin.reportTitle'),
        reportTitle: t('admin.reportTitle'),
        companyName: "D'Glorious Crater Kamojang",
        periodLabel: t('admin.reportPeriod', { period: periodLabel }),
        generatedLabel: t('admin.reportGenerated', {
          date: new Date().toLocaleString('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        }),
        statsSectionTitle: t('admin.reportStatsSection'),
        footerNote: t('admin.reportFooterNote'),
        pageLabel: (pageNum, totalPages) =>
          t('admin.reportPage', { page: pageNum, total: totalPages }),
      },
      fileName: `data-booking-${periodRangeLabel(range, ref)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.pdf`,
      // Landscape — tabelnya 10 kolom (kode/tamu/WA/tipe/tgl booking/check-in/
      // check-out/sumber/total/status), kesempitan banget kalau potret.
      orientation: 'landscape',
    });
  }

  function handleExportExcel() {
    const {
      totalRevenue,
      belumLunas,
      menginap,
      statusBreakdown,
      sourceBreakdown,
      periodLabel,
    } = buildExportSummary();

    exportBookingExcel({
      summarySheetName: t('admin.reportSheetSummary'),
      detailSheetName: t('admin.reportSheetDetail'),
      title: t('admin.reportTitle'),
      companyName: "D'Glorious Crater Kamojang",
      periodLabel: t('admin.reportPeriod', { period: periodLabel }),
      generatedLabel: t('admin.reportGenerated', {
        date: new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      }),
      statsSectionTitle: t('admin.reportStatsSection'),
      // Sengaja dikirim sebagai number (bukan string) + numFmt — kalau angka
      // dikirim sebagai teks, Excel nandain tiap sel pakai segitiga hijau
      // "number stored as text" dan nilainya gak bisa dipakai buat hitung.
      stats: [
        {
          label: t('admin.reportStatTotalBooking'),
          value: exportBookings.length,
        },
        {
          label: t('admin.reportStatTotalRevenue'),
          value: totalRevenue,
          numFmt: '"Rp"#,##0',
        },
        { label: t('admin.reportStatBelumLunas'), value: belumLunas },
        { label: t('admin.reportStatMenginap'), value: menginap },
      ],
      breakdowns: [
        { title: t('admin.reportStatusBreakdown'), rows: statusBreakdown },
        { title: t('admin.reportSourceBreakdown'), rows: sourceBreakdown },
      ],
      tableSectionTitle: t('admin.reportBookingSection'),
      totalLabel: t('admin.reportGrandTotal'),
      footerNote: t('admin.reportFooterNote'),
      headers: [
        t('admin.tCode'),
        t('admin.tGuest'),
        t('admin.tWa'),
        t('admin.tType'),
        t('admin.tBookingDate'),
        t('admin.tCheckIn'),
        t('admin.tCheckOut'),
        t('admin.tSource'),
        t('admin.tTotal'),
        t('admin.tStatus'),
      ],
      rows: exportBookings.map((b) => {
        const s = displayStatus(b);
        return {
          kode: b.kode,
          guest: b.guest,
          wa: b.wa,
          unit: roomsSummaryShort(b.rooms),
          bookingDate: formatDate(b.createdAt),
          checkIn: formatDate(b.checkIn),
          checkOut: formatDate(b.checkOut),
          source:
            b.source === 'WHATSAPP' ? t('admin.whatsapp') : t('admin.walkin'),
          total: b.total,
          status: statusLabelId[s],
          statusColorHex: STATUS_COLORS[s],
        };
      }),
      noDataText: t('admin.reportNoBookings'),
      fileName: `data-booking-${periodRangeLabel(range, ref)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.xlsx`,
    });
  }

  async function handleUpdateStatus(newStatus: BookingStatusUpdate) {
    if (!selected || !token) return;
    await updateBookingStatus(token, selected.kode, newStatus);
    await refreshList();
  }

  return (
    <DashboardLayout title={t('dashboard.bookings')}>
      {/* ── Strip ringkasan — ikut filter yang lagi aktif ───────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t('admin.reportStatTotalBooking')}
          value={String(exportBookings.length)}
          hint={searchActive ? t('admin.filterAll') : periodRangeLabel(range, ref)}
        />
        <StatTile
          label={t('admin.reportStatTotalRevenue')}
          value={formatIDR(summary.totalRevenue)}
          valueClass="text-forest-700"
        />
        <StatTile
          label={t('admin.reportStatBelumLunas')}
          value={String(summary.belumLunas)}
          valueClass={summary.belumLunas > 0 ? 'text-[#c8952e]' : undefined}
        />
        <StatTile
          label={t('admin.reportStatMenginap')}
          value={String(summary.menginap)}
          valueClass={summary.menginap > 0 ? 'text-[#2f6b41]' : undefined}
        />
      </div>

      {/* ── Panel filter ────────────────────────────────────────────────── */}
      <Card className="mt-4">
        <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
          {/* Baris 1: pencarian + tombol export */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative w-full min-w-0 sm:flex-1">
              <Search
                size={16}
                strokeWidth={2}
                aria-hidden
                className="text-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={t('admin.searchPlaceholder')}
                className="border-input focus:border-forest-500 w-full rounded-[10px] border py-2.5 pr-9 pl-10 text-[13.5px] outline-none"
              />
              {searchActive && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  aria-label={t('admin.clearSearch')}
                  className="text-muted hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              )}
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <ExportButton
                onClick={handleExportExcel}
                icon={<FileSpreadsheet size={15} strokeWidth={1.9} aria-hidden />}
                className="bg-[#1B4332] hover:bg-[#153728]"
              >
                {t('admin.exportExcel')}
              </ExportButton>
              <ExportButton
                onClick={handleExport}
                icon={<FileText size={15} strokeWidth={1.9} aria-hidden />}
                className="bg-terracotta-500 hover:bg-terracotta-600"
              >
                {t('admin.export')}
              </ExportButton>
            </div>
          </div>

          {searchActive && (
            <p className="text-muted -mt-1 flex items-center gap-1.5 text-[11.5px]">
              <Search size={12} strokeWidth={2} aria-hidden />
              {t('admin.searchOverridesNote')}
            </p>
          )}

          {/* Baris 2: status — pill + jumlah, jauh lebih cepat discan daripada dropdown */}
          <FilterRow label={t('admin.filterStatus')}>
            <SegGroup>
              <SegButton
                active={statusFilter === ''}
                onClick={() => {
                  setStatusFilter('');
                  setPage(1);
                }}
                count={scopedForStatus.length}
              >
                {t('admin.filterAll')}
              </SegButton>
              {STATUSES.map((s) => (
                <SegButton
                  key={s}
                  active={statusFilter === s}
                  onClick={() => {
                    setStatusFilter(statusFilter === s ? '' : s);
                    setPage(1);
                  }}
                  dot={STATUS_DOTS[s]}
                  count={statusCount(s)}
                >
                  {statusLabelId[s]}
                </SegButton>
              ))}
            </SegGroup>
          </FilterRow>

          {/* Baris 3: sumber + periode + tanggal check-in */}
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <FilterRow label={t('admin.filterSource')}>
              <SegGroup>
                <SegButton
                  active={sourceFilter === ''}
                  onClick={() => {
                    setSourceFilter('');
                    setPage(1);
                  }}
                >
                  {t('admin.filterAll')}
                </SegButton>
                {SOURCES.map((src) => (
                  <SegButton
                    key={src}
                    active={sourceFilter === src}
                    onClick={() => {
                      setSourceFilter(sourceFilter === src ? '' : src);
                      setPage(1);
                    }}
                    dot={src === 'WHATSAPP' ? 'bg-blue-500' : 'bg-orange-600'}
                    count={sourceCount(src)}
                  >
                    {src === 'WHATSAPP' ? t('admin.whatsapp') : t('admin.walkin')}
                  </SegButton>
                ))}
              </SegGroup>
            </FilterRow>

            <FilterRow
              label={t('admin.filterPeriod')}
              className={cn(searchActive && 'pointer-events-none opacity-40')}
            >
              <RangeFilter
                range={range}
                onRangeChange={(r) => {
                  setRange(r);
                  setPage(1);
                }}
                customRange={customRange}
                onCustomRangeChange={(c) => {
                  setCustomRange(c);
                  setPage(1);
                }}
              />
            </FilterRow>

            <FilterRow label={t('admin.filterCheckInDate')}>
              <div className="relative">
                <CalendarDays
                  size={15}
                  strokeWidth={1.9}
                  aria-hidden
                  className="text-muted pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
                />
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => {
                    setCheckInDate(e.target.value);
                    setPage(1);
                  }}
                  className="border-input focus:border-forest-500 rounded-xl border bg-white py-2.5 pr-3 pl-9 text-[13px] outline-none"
                />
              </div>
            </FilterRow>
          </div>

          {/* Baris 4: rangkuman filter aktif — sekali lihat tahu apa yang lagi nyaring */}
          {anyFilterActive && (
            <div className="border-border flex flex-wrap items-center gap-2 border-t border-dashed pt-3.5">
              <span className="text-muted text-[11px] font-semibold tracking-[0.05em] uppercase">
                {t('admin.activeFilters')}
              </span>
              {searchActive && (
                <Chip
                  label={t('admin.chipSearch', { q: search.trim() })}
                  onRemove={() => {
                    setSearch('');
                    setPage(1);
                  }}
                />
              )}
              {statusFilter !== '' && (
                <Chip
                  label={statusLabelId[statusFilter]}
                  dot={STATUS_DOTS[statusFilter]}
                  onRemove={() => {
                    setStatusFilter('');
                    setPage(1);
                  }}
                />
              )}
              {sourceFilter !== '' && (
                <Chip
                  label={
                    sourceFilter === 'WHATSAPP'
                      ? t('admin.whatsapp')
                      : t('admin.walkin')
                  }
                  dot={sourceFilter === 'WHATSAPP' ? 'bg-blue-500' : 'bg-orange-600'}
                  onRemove={() => {
                    setSourceFilter('');
                    setPage(1);
                  }}
                />
              )}
              {checkInDate !== '' && (
                <Chip
                  label={t('admin.chipCheckIn', { date: formatDate(checkInDate) })}
                  onRemove={() => {
                    setCheckInDate('');
                    setPage(1);
                  }}
                />
              )}
              <button
                type="button"
                onClick={resetFilters}
                className="text-accent ml-auto text-[12.5px] font-semibold"
              >
                {t('admin.resetFilters')}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tabel ───────────────────────────────────────────────────────── */}
      <div className="mt-4">
        {listError && (
          <div className="border-border rounded-2xl border bg-white px-4 py-8 text-center">
            <p className="text-sm text-red-600">{listError}</p>
            <button
              onClick={() => void refreshList()}
              className="text-forest-700 mt-2 text-sm font-semibold underline"
            >
              {t('admin.retry')}
            </button>
          </div>
        )}
        {!listError && bookings === null && (
          <div className="border-border text-muted rounded-2xl border bg-white px-4 py-8 text-center text-sm">
            {t('admin.loading')}
          </div>
        )}
        {!listError && bookings !== null && (
          <Card>
            <CardContent>
              {filtered.length > 0 ? (
                <Table bare>
                  <THead>
                    <Tr>
                      <Th className="whitespace-nowrap">{t('admin.tCode')}</Th>
                      <Th className="whitespace-nowrap">{t('admin.tGuest')}</Th>
                      <Th className="whitespace-nowrap">{t('admin.tWa')}</Th>
                      <Th className="whitespace-nowrap">{t('admin.tType')}</Th>
                      <Th className="whitespace-nowrap">
                        {t('admin.tBookingDate')}
                      </Th>
                      <Th className="whitespace-nowrap">{t('admin.tCheckIn')}</Th>
                      <Th className="whitespace-nowrap">
                        {t('admin.tCheckOut')}
                      </Th>
                      <Th className="whitespace-nowrap">{t('admin.tSource')}</Th>
                      <Th className="whitespace-nowrap">{t('admin.tTotal')}</Th>
                      <Th className="whitespace-nowrap">{t('admin.tStatus')}</Th>
                      <Th></Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {paged.map((b) => (
                      <Tr
                        key={b.kode}
                        onClick={() => setSelectedKode(b.kode)}
                        className="group cursor-pointer"
                      >
                        <Td className="text-forest-700 font-semibold whitespace-nowrap">
                          {b.kode}
                        </Td>
                        <Td className="whitespace-nowrap">{b.guest}</Td>
                        <Td className="text-muted whitespace-nowrap">{b.wa}</Td>
                        <Td className="text-muted whitespace-nowrap">
                          {roomsSummary(b.rooms)}
                        </Td>
                        <Td className="text-muted whitespace-nowrap">
                          {formatDate(b.createdAt)}
                        </Td>
                        <Td className="whitespace-nowrap">
                          {formatDate(b.checkIn)}
                        </Td>
                        <Td className="whitespace-nowrap">
                          {formatDate(b.checkOut)}
                        </Td>
                        <Td className="whitespace-nowrap">
                          <SourceBadge source={b.source} />
                        </Td>
                        <Td className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold">
                              {formatIDR(b.total)}
                            </span>
                            {b.raw.isPriceOverride && (
                              <RowTag className="bg-amber-50 text-amber-700">
                                Manual
                              </RowTag>
                            )}
                            {b.raw.discount > 0 && (
                              <RowTag className="bg-green-50 text-green-700">
                                Diskon
                              </RowTag>
                            )}
                            {b.raw.editLogs.length > 0 && (
                              <RowTag className="bg-stone-100 text-stone-500">
                                ✏ Diedit
                              </RowTag>
                            )}
                          </div>
                        </Td>
                        <Td className="whitespace-nowrap">
                          <StatusBadge status={displayStatus(b)} />
                        </Td>
                        <Td className="text-accent font-semibold whitespace-nowrap">
                          <span className="inline-flex items-center gap-0.5">
                            {t('admin.detail')}
                            <ChevronRight
                              size={14}
                              strokeWidth={2.5}
                              aria-hidden
                              className="transition-transform group-hover:translate-x-0.5"
                            />
                          </span>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center gap-1.5 px-4 py-14 text-center">
                  <SearchX
                    size={30}
                    strokeWidth={1.4}
                    aria-hidden
                    className="text-cream-400"
                  />
                  <p className="text-[13.5px] font-semibold">
                    {t('admin.noResults')}
                  </p>
                  <p className="text-muted text-[12.5px]">
                    {t('admin.noResultsHint')}
                  </p>
                  {anyFilterActive && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="text-accent mt-1.5 text-[13px] font-semibold"
                    >
                      {t('admin.resetFilters')}
                    </button>
                  )}
                </div>
              )}

              {/* Pagination */}
              {filtered.length > 0 && (
                <div className="text-muted border-border mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3 text-[13px]">
                  <span>
                    {t('admin.showingRange', {
                      from: (currentPage - 1) * PAGE_SIZE + 1,
                      to: Math.min(currentPage * PAGE_SIZE, filtered.length),
                      total: filtered.length,
                    })}
                  </span>
                  <div className="flex items-center gap-2">
                    <PageButton
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label={t('admin.prevPage')}
                    >
                      <ChevronLeft size={16} strokeWidth={2.2} aria-hidden />
                    </PageButton>
                    <span className="tabular-nums">
                      {t('admin.pageOf', {
                        page: currentPage,
                        total: pageCount,
                      })}
                    </span>
                    <PageButton
                      onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                      disabled={currentPage === pageCount}
                      aria-label={t('admin.nextPage')}
                    >
                      <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
                    </PageButton>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {selected && (
        <BookingDetailModal
          booking={selected}
          onClose={() => setSelectedKode(null)}
          onMarkLunas={() => handleUpdateStatus('LUNAS')}
          onMarkCheckedIn={() => handleUpdateStatus('CHECKED_IN')}
          onMarkCompleted={() => handleUpdateStatus('COMPLETED')}
          onMarkNoShow={() => handleUpdateStatus('NO_SHOW')}
          onMarkHangus={() => handleUpdateStatus('HANGUS')}
        />
      )}
    </DashboardLayout>
  );
}

function StatTile({
  label,
  value,
  hint,
  valueClass,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <div className="border-border rounded-xl border bg-white px-4 py-3.5 shadow-[0_12px_30px_-22px_rgba(20,53,42,0.4)]">
      <div className="text-muted text-[10.5px] font-semibold tracking-[0.06em] uppercase">
        {label}
      </div>
      {/* Ukuran naik di layar lebar; `break-words` jaga-jaga kalau nominalnya
          sampai miliaran biar membungkus, bukan kepotong di tepi kartu. */}
      <div
        className={cn(
          'mt-1 font-serif text-[16px] leading-tight font-extrabold break-words sm:text-[19px]',
          valueClass,
        )}
      >
        {value}
      </div>
      {hint && (
        <div className="text-muted mt-0.5 truncate text-[11.5px]">{hint}</div>
      )}
    </div>
  );
}

// `min-w-0` penting: default flex item itu `min-width:auto`, jadi kolom filter
// gak mau menyusut di bawah lebar isinya — bikin SegGroup/RangeFilter jebol
// keluar kartu di layar sempit & `overflow-x-auto`-nya gak pernah kepakai.
function FilterRow({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="text-muted text-[10.5px] font-semibold tracking-[0.06em] uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

/** Wadah pill — pola visualnya sengaja disamain sama `RangeFilter`. */
function SegGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-[#e8e2d5] bg-white p-1.5">
      {children}
    </div>
  );
}

function SegButton({
  active,
  onClick,
  dot,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  dot?: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
        active ? 'bg-forest-700 text-white' : 'text-muted hover:bg-cream-100',
      )}
    >
      {dot && (
        <span
          aria-hidden
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            active ? 'bg-white/75' : dot,
          )}
        />
      )}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-md px-1.5 py-px text-[11px] font-bold tabular-nums',
            active ? 'bg-white/20 text-white' : 'bg-cream-100 text-muted',
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Chip({
  label,
  dot,
  onRemove,
}: {
  label: string;
  dot?: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-60 items-center gap-1.5 rounded-lg border border-[#e8e2d5] bg-white py-1 pr-1.5 pl-2.5 text-[12px] font-medium">
      {dot && (
        <span
          aria-hidden
          className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dot)}
        />
      )}
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Hapus filter ${label}`}
        className="text-muted hover:text-foreground hover:bg-cream-100 shrink-0 rounded p-0.5"
      >
        <X size={12} strokeWidth={2.6} aria-hidden />
      </button>
    </span>
  );
}

function ExportButton({
  onClick,
  icon,
  className,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap text-white transition-colors sm:flex-none',
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function PageButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className="border-input hover:bg-cream-100 rounded-[8px] border bg-white p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
      {...props}
    >
      {children}
    </button>
  );
}

function RowTag({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'rounded-[5px] px-1.5 py-0.5 text-[10px] font-semibold',
        className,
      )}
    >
      {children}
    </span>
  );
}
