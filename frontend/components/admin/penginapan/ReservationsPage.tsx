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
  fetchAdminReservations,
  updateReservationStatus,
  type ReservationStatusUpdate,
} from '@/lib/api/reservations';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import {
  roomsSummaryShort,
  roomsSummaryTruncated,
  statusLabelId,
  type ReservationChannel,
  type ReservationStatus,
} from '@/lib/data/admin';
import {
  reservationsCreatedInRange,
  reservationsInRange,
  dateSetForRange,
  periodRangeLabel,
  type CustomRange,
  type DateRange,
} from '@/lib/data/owner';
import { exportReservationExcel } from '@/lib/excel/reservationReport';
import { formatDate, formatDateTime, formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ADMIN_REPORT_THEME, exportReportPdf } from '@/lib/pdf/report';
import {
  ReservationDetailModal,
  displayStatus,
  toDisplay,
  type DisplayReservation,
} from './ReservationDetailModal';
import { SourceBadge, StatusBadge } from './StatusBadge';

// Warna breakdown status/sumber di PDF — samain sama nuansa StatusBadge/SourceBadge di layar.
const STATUS_COLORS: Record<ReservationStatus, string> = {
  DP: '#c8952e',
  LUNAS: '#2c5a8a',
  CHECKED_IN: '#2f6b41',
  COMPLETED: '#1B4332',
  HANGUS: '#b23b30',
  NO_SHOW: '#c15f1e',
};
const SOURCE_COLORS: Record<ReservationChannel, string> = {
  RESERVASI: '#2c5a8a',
  LANGSUNG: '#C1663F',
};

// Dot per status buat pill filter — dicocokin sama `dotTones` di Badge.tsx biar
// warna yang sama dipakai di filter maupun di kolom Status tabel.
const STATUS_DOTS: Record<ReservationStatus, string> = {
  DP: 'bg-orange-400',
  LUNAS: 'bg-blue-500',
  CHECKED_IN: 'bg-green-600',
  COMPLETED: 'bg-green-800',
  HANGUS: 'bg-red-500',
  NO_SHOW: 'bg-orange-600',
};

const STATUSES = Object.keys(statusLabelId) as ReservationStatus[];
const SOURCES: ReservationChannel[] = ['RESERVASI', 'LANGSUNG'];
const PAGE_SIZE = 20;

export function ReservationsPage() {
  const { t } = useTranslation();
  const { token } = useAuth();

  const [reservations, setReservations] = useState<DisplayReservation[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedKode, setSelectedKode] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<ReservationChannel | ''>('');
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
      const data = await fetchAdminReservations(token);
      setReservations(data.map(toDisplay));
      setListError(null);
    } catch (e) {
      setListError(e instanceof ApiError ? e.message : t('common.loadError'));
    }
  }, [token, t]);

  // Pemuatan awal: setState hanya di dalam callback promise, bukan sinkron di
  // badan effect (`refreshList` tetap dipakai setelah ubah status & Coba lagi).
  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchAdminReservations(token)
      .then((data) => {
        if (!active) return;
        setReservations(data.map(toDisplay));
        setListError(null);
      })
      .catch((e) => {
        if (active)
          setListError(e instanceof ApiError ? e.message : t('common.loadError'));
      });
    return () => {
      active = false;
    };
  }, [token, t]);

  const ref = { today: new Date(), custom: customRange };
  const all = reservations ?? [];

  const selected = all.find((b) => b.kode === selectedKode) ?? null;

  const searchActive = search.trim() !== '';
  const q = search.trim().toLowerCase();
  // Scope dasar tabel: begitu ngetik di search, cari di SEMUA reservasi (abaikan
  // periode) — biar gampang nemuin reservasi lama tanpa nebak-nebak periodenya.
  // Status & sumber TETAP berlaku, jadi hasil pencarian masih bisa dipersempit.
  const scoped = searchActive
    ? all.filter(
        (b) =>
          b.kode.toLowerCase().includes(q) ||
          b.guest.toLowerCase().includes(q) ||
          b.wa.toLowerCase().includes(q),
      )
    : reservationsInRange(all, range, ref);


  const matchesStatus = (b: DisplayReservation) =>
    statusFilter === '' || displayStatus(b) === statusFilter;
  const matchesSource = (b: DisplayReservation) =>
    sourceFilter === '' || b.source === sourceFilter;

  // Angka di pill = "berapa hasilnya kalau pill ini diklik", jadi masing-masing
  // dihitung dengan mengabaikan filternya sendiri (status ngabaikan status, dst).
  const scopedForStatus = scoped.filter(matchesSource);
  const scopedForSource = scoped.filter(matchesStatus);
  const statusCount = (s: ReservationStatus) =>
    scopedForStatus.filter((b) => displayStatus(b) === s).length;
  const sourceCount = (src: ReservationChannel) =>
    scopedForSource.filter((b) => b.source === src).length;

  const exportReservations = scoped.filter((b) => matchesStatus(b) && matchesSource(b));
  // Stat tiles = subset tabel: reservasi yang check-in di periode ini SEKALIGUS
  // dibuat di periode yang sama. Reservasi Juli yang check-in Agustus muncul di
  // tabel (operasional) tapi tidak dihitung di stats Agustus.
  const statsReservations = searchActive
    ? exportReservations
    : reservationsCreatedInRange(exportReservations, range, ref);
  const filtered = exportReservations.filter(
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

  // Angka ringkasan — revenue dihitung cash basis by paidAt (sama kayak Overview),
  // dari semua reservasi yang lolos filter status/sumber, tanpa batasan periode reservasi.
  function buildExportSummary() {
    const periodDates = searchActive ? null : dateSetForRange(range, ref);
    const revenueBase = searchActive
      ? exportReservations
      : all.filter((b) => matchesStatus(b) && matchesSource(b));
    const totalRevenue = revenueBase
      .flatMap((b) => b.raw.payments)
      .filter((p): p is { amount: number; paidAt: string } => p.paidAt !== null)
      .filter((p) => !periodDates || periodDates.has(p.paidAt.slice(0, 10)))
      .reduce((sum, p) => sum + p.amount, 0);
    const belumLunas = statsReservations.filter(
      (b) => displayStatus(b) === 'DP',
    ).length;
    const menginap = statsReservations.filter(
      (b) => displayStatus(b) === 'CHECKED_IN',
    ).length;

    const statusCounts = new Map<ReservationStatus, number>();
    statsReservations.forEach((b) => {
      const s = displayStatus(b);
      statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
    });
    const statusBreakdown = STATUSES.filter(
      (s) => (statusCounts.get(s) ?? 0) > 0,
    ).map((s) => ({
      label: statusLabelId[s],
      count: statusCounts.get(s) ?? 0,
      pct:
        statsReservations.length > 0
          ? Math.round(
              ((statusCounts.get(s) ?? 0) / statsReservations.length) * 100,
            )
          : 0,
      colorHex: STATUS_COLORS[s],
    }));

    const sourceCounts: Record<ReservationChannel, number> = {
      RESERVASI: 0,
      LANGSUNG: 0,
    };
    statsReservations.forEach((b) => {
      sourceCounts[b.source] += 1;
    });
    const sourceBreakdown = SOURCES.map((src) => ({
      label: src === 'RESERVASI' ? t('admin.reservasi') : t('admin.langsung'),
      count: sourceCounts[src],
      pct:
        statsReservations.length > 0
          ? Math.round((sourceCounts[src] / statsReservations.length) * 100)
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

  // Tabel export dibaca dari atas ke bawah kayak laporan (kronologis) — beda
  // dari tabel di layar yang sengaja newest-first buat browsing operasional.
  function sortedForExport() {
    return [...exportReservations].sort((a, b) =>
      a.raw.createdAt.localeCompare(b.raw.createdAt),
    );
  }

  function handleExport() {
    const {
      totalRevenue,
      belumLunas,
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
          label: t('admin.reportStatTotalReservation'),
          value: String(statsReservations.length),
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
      ],
      breakdowns: [
        { title: t('admin.reportStatusBreakdown'), rows: statusRows },
        { title: t('admin.reportSourceBreakdown'), rows: sourceRows },
      ],
      table: {
        sectionTitle: t('admin.reportReservationSection'),
        headers: [
          t('admin.tCode'),
          t('admin.tGuest'),
          t('admin.tWa'),
          t('admin.tType'),
          t('admin.tReservationDate'),
          t('admin.tCheckIn'),
          t('admin.tCheckOut'),
          t('admin.tSource'),
          t('admin.tTotal'),
          t('admin.tStatus'),
        ],
        rows: sortedForExport().map((b) => [
          b.kode,
          b.guest,
          b.wa,
          roomsSummaryShort(b.rooms),
          formatDateTime(b.raw.createdAt),
          formatDate(b.checkIn),
          formatDate(b.checkOut),
          b.source === 'RESERVASI' ? t('admin.reservasi') : t('admin.langsung'),
          formatIDR(b.total),
          statusLabelId[displayStatus(b)],
        ]),
        noDataText: t('admin.reportNoReservations'),
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
      fileName: `data-reservation-${periodRangeLabel(range, ref)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.pdf`,
      // Landscape — tabelnya 10 kolom (kode/tamu/WA/tipe/tgl reservasi/check-in/
      // check-out/sumber/total/status), kesempitan banget kalau potret.
      orientation: 'landscape',
    });
  }

  function handleExportExcel() {
    const {
      totalRevenue,
      belumLunas,
      statusBreakdown,
      sourceBreakdown,
      periodLabel,
    } = buildExportSummary();

    exportReservationExcel({
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
          label: t('admin.reportStatTotalReservation'),
          value: statsReservations.length,
        },
        {
          label: t('admin.reportStatTotalRevenue'),
          value: totalRevenue,
          numFmt: '"Rp"#,##0',
        },
        { label: t('admin.reportStatBelumLunas'), value: belumLunas },
      ],
      breakdowns: [
        { title: t('admin.reportStatusBreakdown'), rows: statusBreakdown },
        { title: t('admin.reportSourceBreakdown'), rows: sourceBreakdown },
      ],
      tableSectionTitle: t('admin.reportReservationSection'),
      totalLabel: t('admin.reportGrandTotal'),
      footerNote: t('admin.reportFooterNote'),
      headers: [
        t('admin.tCode'),
        t('admin.tGuest'),
        t('admin.tWa'),
        t('admin.tType'),
        t('admin.tReservationDate'),
        t('admin.tCheckIn'),
        t('admin.tCheckOut'),
        t('admin.tSource'),
        t('admin.tTotal'),
        t('admin.tStatus'),
      ],
      rows: sortedForExport().map((b) => {
        const s = displayStatus(b);
        return {
          kode: b.kode,
          guest: b.guest,
          wa: b.wa,
          unit: roomsSummaryShort(b.rooms),
          reservationDate: formatDateTime(b.raw.createdAt),
          checkIn: formatDate(b.checkIn),
          checkOut: formatDate(b.checkOut),
          source:
            b.source === 'RESERVASI' ? t('admin.reservasi') : t('admin.langsung'),
          total: b.total,
          status: statusLabelId[s],
          statusColorHex: STATUS_COLORS[s],
        };
      }),
      noDataText: t('admin.reportNoReservations'),
      fileName: `data-reservation-${periodRangeLabel(range, ref)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.xlsx`,
    });
  }

  async function handleUpdateStatus(newStatus: ReservationStatusUpdate) {
    if (!selected || !token) return;
    await updateReservationStatus(token, selected.kode, newStatus);
    await refreshList();
  }

  return (
    <DashboardLayout title={t('dashboard.reservations')}>
      {/* ── Strip ringkasan — ikut filter yang lagi aktif ───────────────── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t('admin.reportStatTotalReservation')}
          value={String(statsReservations.length)}
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
                    dot={src === 'RESERVASI' ? 'bg-blue-500' : 'bg-orange-600'}
                    count={sourceCount(src)}
                  >
                    {src === 'RESERVASI' ? t('admin.reservasi') : t('admin.langsung')}
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
                    sourceFilter === 'RESERVASI'
                      ? t('admin.reservasi')
                      : t('admin.langsung')
                  }
                  dot={sourceFilter === 'RESERVASI' ? 'bg-blue-500' : 'bg-orange-600'}
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
              onClick={() => {
              setListError(null);
              void refreshList();
            }}
              className="text-forest-700 mt-2 text-sm font-semibold underline"
            >
              {t('admin.retry')}
            </button>
          </div>
        )}
        {!listError && reservations === null && (
          <div className="border-border text-muted rounded-2xl border bg-white px-4 py-8 text-center text-sm">
            {t('admin.loading')}
          </div>
        )}
        {!listError && reservations !== null && (
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
                        {t('admin.tReservationDate')}
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
                          {roomsSummaryTruncated(b.rooms)}
                        </Td>
                        <Td className="text-muted whitespace-nowrap">
                          {formatDateTime(b.raw.createdAt)}
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
        <ReservationDetailModal
          reservation={selected}
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
