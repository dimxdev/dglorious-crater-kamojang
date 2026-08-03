'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button, Input, RangeFilter, Select, TBody, Td, Th, THead, Table, Tr } from '@/components/ui';
import { cn } from '@/lib/cn';
import {
  adminBookings,
  effectiveStatus,
  roomItemLabel,
  roomsSummary,
  roomsSummaryShort,
  statusLabelId,
  type AdminBooking,
  type BookingChannel,
  type BookingRoomItem,
  type BookingStatus,
  type ExtraBedType,
} from '@/lib/data/admin';
import { bookingsInRange, periodRangeLabel, type CustomRange, type DateRange } from '@/lib/data/owner';
import { localizeRooms } from '@/lib/data/rooms';
import { exportBookingExcel } from '@/lib/excel/bookingReport';
import { formatDate, formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { ADMIN_REPORT_THEME, exportReportPdf } from '@/lib/pdf/report';
import { RoomItemsEditor } from './RoomItemsEditor';
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

const STATUSES = Object.keys(statusLabelId) as BookingStatus[];
const PAGE_SIZE = 20;

export function BookingsPage() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState<AdminBooking[]>(adminBookings);
  const [selectedKode, setSelectedKode] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [sourceFilter, setSourceFilter] = useState<BookingChannel | ''>('');
  // Rentang periode (Hari Ini/Minggu Ini/Bulan Ini/Custom) — sama pola kayak
  // dashboard Owner, TIDAK BISA dikosongkan (jangan sampai defaultnya nampilin
  // semua data sekaligus kalau datanya udah numpuk berbulan-bulan). Ini yang
  // nentuin isi Export PDF.
  const [range, setRange] = useState<DateRange>('rangeMonth');
  const [customRange, setCustomRange] = useState<CustomRange>({ from: '', to: '' });
  // Filter tambahan buat cari 1 tanggal check-in spesifik dgn cepat — cuma
  // mempersempit tabel di layar, sengaja TIDAK ikut ke Export PDF (PDF tetap
  // ngikutin rentang periode di atas, biar laporannya konsisten per periode).
  const [checkInDate, setCheckInDate] = useState('');
  const [page, setPage] = useState(1);

  const ref = { today: new Date(), custom: customRange };

  const selected = bookings.find((b) => b.kode === selectedKode) ?? null;

  function updateBooking(kode: string, patch: Partial<AdminBooking>) {
    setBookings((prev) => prev.map((b) => (b.kode === kode ? { ...b, ...patch } : b)));
  }

  const searchActive = search.trim() !== '';
  // Search sengaja dibikin gak kebatasin filter lain (periode/status/sumber) —
  // begitu ngetik di search, cari di SEMUA booking, biar gampang nemuin
  // booking tertentu walau lagi difilter periode/status/sumber yang beda.
  const exportBookings = searchActive
    ? bookings.filter((b) => {
        const q = search.trim().toLowerCase();
        return (
          b.kode.toLowerCase().includes(q) ||
          b.guest.toLowerCase().includes(q) ||
          b.wa.toLowerCase().includes(q)
        );
      })
    : bookingsInRange(range, ref, bookings).filter((b) => {
        const matchesStatus = statusFilter === '' || effectiveStatus(b) === statusFilter;
        const matchesSource = sourceFilter === '' || b.source === sourceFilter;
        return matchesStatus && matchesSource;
      });
  const filtered = exportBookings.filter((b) => checkInDate === '' || b.checkIn === checkInDate);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Angka ringkasan yang sama dipakai buat Export PDF maupun Export Excel,
  // biar dua-duanya selalu konsisten (gak ada logic ganda yang bisa ketinggalan sinkron).
  function buildExportSummary() {
    const totalRevenue = exportBookings.reduce((sum, b) => sum + b.total, 0);
    const belumLunas = exportBookings.filter((b) => effectiveStatus(b) === 'DP').length;
    const menginap = exportBookings.filter((b) => effectiveStatus(b) === 'CHECKED_IN').length;

    const statusCounts = new Map<BookingStatus, number>();
    exportBookings.forEach((b) => {
      const s = effectiveStatus(b);
      statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
    });
    const statusBreakdown = STATUSES.filter((s) => (statusCounts.get(s) ?? 0) > 0).map((s) => ({
      label: statusLabelId[s],
      count: statusCounts.get(s) ?? 0,
      pct: exportBookings.length > 0 ? Math.round(((statusCounts.get(s) ?? 0) / exportBookings.length) * 100) : 0,
      colorHex: STATUS_COLORS[s],
    }));

    const sourceCounts: Record<BookingChannel, number> = { WHATSAPP: 0, WALK_IN: 0 };
    exportBookings.forEach((b) => {
      sourceCounts[b.source] += 1;
    });
    const sourceBreakdown = (['WHATSAPP', 'WALK_IN'] as BookingChannel[]).map((src) => ({
      label: src === 'WHATSAPP' ? t('admin.whatsapp') : t('admin.walkin'),
      count: sourceCounts[src],
      pct: exportBookings.length > 0 ? Math.round((sourceCounts[src] / exportBookings.length) * 100) : 0,
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

  function handleExport() {
    const { totalRevenue, belumLunas, menginap, statusBreakdown, sourceBreakdown, periodLabel } =
      buildExportSummary();
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
          statusLabelId[effectiveStatus(b)],
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
          date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
        }),
        statsSectionTitle: t('admin.reportStatsSection'),
        footerNote: t('admin.reportFooterNote'),
        pageLabel: (pageNum, totalPages) => t('admin.reportPage', { page: pageNum, total: totalPages }),
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
    const { totalRevenue, belumLunas, menginap, statusBreakdown, sourceBreakdown, periodLabel } =
      buildExportSummary();

    exportBookingExcel({
      summarySheetName: t('admin.reportSheetSummary'),
      detailSheetName: t('admin.reportSheetDetail'),
      title: t('admin.reportTitle'),
      companyName: "D'Glorious Crater Kamojang",
      periodLabel: t('admin.reportPeriod', { period: periodLabel }),
      generatedLabel: t('admin.reportGenerated', {
        date: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      }),
      statsSectionTitle: t('admin.reportStatsSection'),
      // Sengaja dikirim sebagai number (bukan string) + numFmt — kalau angka
      // dikirim sebagai teks, Excel nandain tiap sel pakai segitiga hijau
      // "number stored as text" dan nilainya gak bisa dipakai buat hitung.
      stats: [
        { label: t('admin.reportStatTotalBooking'), value: exportBookings.length },
        { label: t('admin.reportStatTotalRevenue'), value: totalRevenue, numFmt: '"Rp"#,##0' },
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
        const status = effectiveStatus(b);
        return {
          kode: b.kode,
          guest: b.guest,
          wa: b.wa,
          unit: roomsSummaryShort(b.rooms),
          bookingDate: formatDate(b.createdAt),
          checkIn: formatDate(b.checkIn),
          checkOut: formatDate(b.checkOut),
          source: b.source === 'WHATSAPP' ? t('admin.whatsapp') : t('admin.walkin'),
          total: b.total,
          status: statusLabelId[status],
          statusColorHex: STATUS_COLORS[status],
        };
      }),
      noDataText: t('admin.reportNoBookings'),
      fileName: `data-booking-${periodRangeLabel(range, ref)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')}.xlsx`,
    });
  }

  return (
    <DashboardLayout title={t('dashboard.bookings')}>
      {/* Filter bar */}
      <div className="border-border flex flex-col gap-3 rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* `w-full` di mobile: search ambil satu baris penuh, biar 2 dropdown
              di bawahnya turun & kebagian lebar yang cukup buat kebaca. */}
          <div className="w-full sm:min-w-50 sm:flex-1">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={t('admin.searchPlaceholder')}
              className="border-input w-full rounded-[10px] border px-3.5 py-2.5 text-[13.5px] outline-none focus:border-forest-500"
            />
            {searchActive && (
              <p className="text-muted mt-1 text-[11.5px]">{t('admin.searchOverridesNote')}</p>
            )}
          </div>
          <select
            value={statusFilter}
            disabled={searchActive}
            onChange={(e) => {
              setStatusFilter(e.target.value as BookingStatus | '');
              setPage(1);
            }}
            className="border-input min-w-36 flex-1 rounded-[10px] border bg-white px-3 py-2.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-0 sm:flex-none"
          >
            <option value="">{t('admin.allStatus')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabelId[s]}
              </option>
            ))}
          </select>
          <select
            value={sourceFilter}
            disabled={searchActive}
            onChange={(e) => {
              setSourceFilter(e.target.value as BookingChannel | '');
              setPage(1);
            }}
            className="border-input min-w-36 flex-1 rounded-[10px] border bg-white px-3 py-2.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-40 sm:min-w-0 sm:flex-none"
          >
            <option value="">{t('admin.allSource')}</option>
            <option value="WHATSAPP">{t('admin.whatsapp')}</option>
            <option value="WALK_IN">{t('admin.walkin')}</option>
          </select>
        </div>

        <div
          className={cn(
            'flex flex-wrap items-end gap-3 border-t border-dashed border-[#e2dccb] pt-3',
            searchActive && 'pointer-events-none opacity-40',
          )}
        >
          <FilterField label={t('admin.filterPeriod')} className="w-full sm:w-auto">
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
          </FilterField>
          <FilterField label={t('admin.filterCheckInDate')}>
            <input
              type="date"
              value={checkInDate}
              onChange={(e) => {
                setCheckInDate(e.target.value);
                setPage(1);
              }}
              className="border-input rounded-[10px] border bg-white px-3 py-2 text-[13px]"
            />
          </FilterField>
          {checkInDate !== '' && (
            <button
              onClick={() => {
                setCheckInDate('');
                setPage(1);
              }}
              className="text-accent text-[12.5px] font-semibold"
            >
              {t('admin.clearDateFilter')}
            </button>
          )}
        </div>

        {/* Di mobile dua tombol dibagi rata biar gak numpuk mepet kanan. */}
        <div className="flex gap-2.5 border-t border-dashed border-[#e2dccb] pt-3 sm:justify-end">
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex-1 rounded-lg bg-[#1B4332] px-4 py-2 text-[13px] font-semibold whitespace-nowrap text-white hover:bg-[#153728] sm:flex-none"
          >
            {t('admin.exportExcel')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="bg-terracotta-500 hover:bg-terracotta-600 flex-1 rounded-lg px-4 py-2 text-[13px] font-semibold whitespace-nowrap text-white sm:flex-none"
          >
            {t('admin.export')}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4">
        <Table>
          <THead>
            <Tr>
              <Th className="whitespace-nowrap">{t('admin.tCode')}</Th>
              <Th className="whitespace-nowrap">{t('admin.tGuest')}</Th>
              <Th className="whitespace-nowrap">{t('admin.tWa')}</Th>
              <Th className="whitespace-nowrap">{t('admin.tType')}</Th>
              <Th className="whitespace-nowrap">{t('admin.tBookingDate')}</Th>
              <Th className="whitespace-nowrap">{t('admin.tCheckIn')}</Th>
              <Th className="whitespace-nowrap">{t('admin.tCheckOut')}</Th>
              <Th className="whitespace-nowrap">{t('admin.tSource')}</Th>
              <Th className="whitespace-nowrap">{t('admin.tTotal')}</Th>
              <Th className="whitespace-nowrap">{t('admin.tStatus')}</Th>
              <Th></Th>
            </Tr>
          </THead>
          <TBody>
            {paged.map((b) => (
              <Tr key={b.kode} onClick={() => setSelectedKode(b.kode)} className="cursor-pointer">
                <Td className="text-forest-700 font-semibold whitespace-nowrap">{b.kode}</Td>
                <Td className="whitespace-nowrap">{b.guest}</Td>
                <Td className="text-muted whitespace-nowrap">{b.wa}</Td>
                <Td className="text-muted whitespace-nowrap">{roomsSummary(b.rooms)}</Td>
                <Td className="text-muted whitespace-nowrap">{formatDate(b.createdAt)}</Td>
                <Td className="whitespace-nowrap">{formatDate(b.checkIn)}</Td>
                <Td className="whitespace-nowrap">{formatDate(b.checkOut)}</Td>
                <Td className="whitespace-nowrap">
                  <SourceBadge source={b.source} />
                </Td>
                <Td className="font-semibold whitespace-nowrap">{formatIDR(b.total)}</Td>
                <Td className="whitespace-nowrap">
                  <StatusBadge status={effectiveStatus(b)} />
                </Td>
                <Td className="text-accent font-semibold whitespace-nowrap">
                  {t('admin.detail')} ›
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
        {filtered.length === 0 && (
          <div className="text-muted border-border border-t bg-white px-4 py-8 text-center text-sm">
            {t('admin.noResults')}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="text-muted mt-3 flex flex-wrap items-center justify-between gap-3 text-[13px]">
            <span>
              {t('admin.showingRange', {
                from: (currentPage - 1) * PAGE_SIZE + 1,
                to: Math.min(currentPage * PAGE_SIZE, filtered.length),
                total: filtered.length,
              })}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="border-input rounded-[8px] border bg-white px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('admin.prevPage')}
              </button>
              <span>{t('admin.pageOf', { page: currentPage, total: pageCount })}</span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={currentPage === pageCount}
                className="border-input rounded-[8px] border bg-white px-3 py-1.5 font-medium disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('admin.nextPage')}
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <DetailModal
          booking={selected}
          onClose={() => setSelectedKode(null)}
          onUpdate={(patch) => updateBooking(selected.kode, patch)}
        />
      )}
    </DashboardLayout>
  );
}

// `min-w-0` penting: default flex item itu `min-width:auto`, jadi kolom filter
// gak mau menyusut di bawah lebar isinya — bikin RangeFilter jebol keluar kartu
// di layar sempit & `overflow-x-auto`-nya gak pernah kepakai.
function FilterField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <span className="text-muted text-[11px] font-medium tracking-[0.03em] uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

type EditForm = {
  guest: string;
  wa: string;
  rooms: BookingRoomItem[];
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  extraBedQty: number;
  extraBedType: ExtraBedType;
  notes: string;
  total: number;
};

function toEditForm(b: AdminBooking): EditForm {
  return {
    guest: b.guest,
    wa: b.wa,
    rooms: b.rooms,
    checkIn: b.checkIn,
    checkOut: b.checkOut,
    adults: b.adults,
    children: b.children,
    extraBedQty: b.extraBedQty,
    extraBedType: b.extraBedType ?? 'with',
    notes: b.notes ?? '',
    total: b.total,
  };
}

function DetailModal({
  booking,
  onClose,
  onUpdate,
}: {
  booking: AdminBooking;
  onClose: () => void;
  onUpdate: (patch: Partial<AdminBooking>) => void;
}) {
  const { t, locale } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(() => toEditForm(booking));

  const status = effectiveStatus(booking);
  // Cuma DP & LUNAS yang boleh diedit — begitu tamu sudah CHECKED_IN (apalagi
  // status turunan COMPLETED/HANGUS/NO_SHOW), datanya dianggap final.
  const canEdit = status === 'DP' || status === 'LUNAS';

  const roomOptions = localizeRooms(locale).map((r) => ({
    value: r.slug,
    label: `${r.name} — ${r.category}`,
  }));
  const extraBedOptions = [
    { value: 'with', label: t('admin.withBed') },
    { value: 'without', label: t('admin.withoutBed') },
  ];

  function startEdit() {
    setForm(toEditForm(booking));
    setEditing(true);
  }

  function saveEdit() {
    onUpdate({
      guest: form.guest,
      wa: form.wa,
      rooms: form.rooms,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      adults: form.adults,
      children: form.children,
      extraBedQty: form.extraBedQty,
      extraBedType: form.extraBedQty > 0 ? form.extraBedType : undefined,
      notes: form.notes.trim() === '' ? undefined : form.notes.trim(),
      total: form.total,
    });
    setEditing(false);
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-5">
      <button aria-hidden tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-[#141916]/50" />
      <div className="relative z-10 flex max-h-[90vh] w-140 max-w-full flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#eee] px-6 py-5">
          <div>
            <div className="text-muted text-xs">{t('admin.dmTitle')}</div>
            <div className="mt-0.5 flex items-center gap-2.5">
              <span className="text-forest-700 font-serif text-2xl font-extrabold">
                {booking.kode}
              </span>
              <StatusBadge status={status} />
            </div>
          </div>
          <button onClick={onClose} className="text-xl text-[#999]" aria-label="Tutup">
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          {editing ? (
            <div className="flex flex-col gap-4">
              <Section title={t('admin.dmSectionGuest')}>
                <div className="grid grid-cols-2 gap-3.5">
                  <Input
                    label={t('admin.guestName')}
                    value={form.guest}
                    onChange={(e) => setForm((f) => ({ ...f, guest: e.target.value }))}
                  />
                  <Input
                    label={t('admin.guestPhone')}
                    value={form.wa}
                    onChange={(e) => setForm((f) => ({ ...f, wa: e.target.value }))}
                  />
                </div>
              </Section>

              <Section title={t('admin.dmSectionStay')}>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="col-span-2">
                    <label className="text-foreground text-sm font-medium">
                      {t('admin.lodgingType')}
                    </label>
                    <div className="mt-1.5">
                      <RoomItemsEditor
                        value={form.rooms}
                        onChange={(rooms) => setForm((f) => ({ ...f, rooms }))}
                        options={roomOptions}
                        qtyLabel={t('admin.roomQty')}
                        addLabel={t('admin.addRoomItem')}
                      />
                    </div>
                  </div>
                  <Input
                    label={t('admin.tCheckIn')}
                    type="date"
                    value={form.checkIn}
                    onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))}
                  />
                  <Input
                    label={t('admin.tCheckOut')}
                    type="date"
                    value={form.checkOut}
                    onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
                  />
                  <Input
                    label={t('admin.adults')}
                    type="number"
                    min={1}
                    value={form.adults}
                    onChange={(e) => setForm((f) => ({ ...f, adults: Number(e.target.value) || 1 }))}
                  />
                  <Input
                    label={t('admin.children')}
                    type="number"
                    min={0}
                    value={form.children}
                    onChange={(e) => setForm((f) => ({ ...f, children: Number(e.target.value) || 0 }))}
                  />
                  <Input
                    label={t('admin.extraBedQty')}
                    type="number"
                    min={0}
                    value={form.extraBedQty}
                    onChange={(e) => setForm((f) => ({ ...f, extraBedQty: Number(e.target.value) || 0 }))}
                  />
                  <Select
                    label={t('admin.extraBedType')}
                    value={form.extraBedType}
                    onChange={(e) => setForm((f) => ({ ...f, extraBedType: e.target.value as ExtraBedType }))}
                    options={extraBedOptions}
                  />
                  <div className="col-span-2">
                    <Input
                      label={t('admin.notes')}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      placeholder={t('admin.notesPlaceholder')}
                    />
                  </div>
                </div>
              </Section>

              <Section title={t('admin.tTotal')}>
                <Input
                  type="number"
                  value={form.total}
                  onChange={(e) => setForm((f) => ({ ...f, total: Number(e.target.value) || 0 }))}
                />
              </Section>

              <div className="flex gap-2.5">
                <Button className="rounded-xl" onClick={saveEdit}>
                  {t('admin.dmSaveEdit')}
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditing(false)}>
                  {t('admin.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <Section title={t('admin.dmSectionGuest')}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t('admin.tGuest')} value={booking.guest} />
                  <Field label={t('admin.tWa')} value={booking.wa} />
                </div>
              </Section>

              <Section title={t('admin.dmSectionStay')}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="text-muted text-xs">{t('admin.tType')}</div>
                    <div className="flex flex-col gap-0.5">
                      {booking.rooms.map((item, i) => (
                        <div key={i} className="font-semibold">
                          {roomItemLabel(item)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <Field label={t('admin.tBookingDate')} value={formatDate(booking.createdAt)} />
                  <Field label={t('admin.tCheckIn')} value={formatDate(booking.checkIn)} />
                  <Field label={t('admin.tCheckOut')} value={formatDate(booking.checkOut)} />
                  <Field label={t('admin.adults')} value={String(booking.adults)} />
                  <Field label={t('admin.children')} value={String(booking.children)} />
                  {booking.extraBedQty > 0 && (
                    <div className="col-span-2">
                      <Field
                        label={t('admin.extraBedQty')}
                        value={`${booking.extraBedQty}× ${
                          booking.extraBedType === 'without' ? t('admin.withoutBed') : t('admin.withBed')
                        }`}
                      />
                    </div>
                  )}
                  {booking.notes && (
                    <div className="col-span-2">
                      <Field label={t('admin.notes')} value={booking.notes} />
                    </div>
                  )}
                  {booking.source === 'WHATSAPP' && (
                    <div className="col-span-2">
                      <Field
                        label={t('admin.ktpPhoto')}
                        value={booking.hasKtpPhoto ? `✓ ${t('admin.ktpUploaded')}` : `— ${t('admin.ktpMissing')}`}
                        valueClass={booking.hasKtpPhoto ? 'text-[#2f6b41]' : 'text-[#b23b30]'}
                      />
                    </div>
                  )}
                </div>
              </Section>

              <Section title={t('admin.dmSectionPayment')}>
                <Field label={t('admin.tTotal')} value={formatIDR(booking.total)} valueClass="text-forest-700" />
              </Section>

              {status === 'CHECKED_IN' && (
                <p className="text-muted text-[12.5px]">{t('admin.dmAutoCompleteNote')}</p>
              )}
              {status === 'LUNAS' && (
                <p className="text-muted text-[12.5px]">{t('admin.dmAutoNoShowNote')}</p>
              )}
              {status === 'DP' && (
                <p className="text-muted text-[12.5px]">{t('admin.dmAutoHangusNote')}</p>
              )}

              <div className="flex flex-wrap gap-2.5">
                {status === 'DP' && (
                  <Button className="rounded-xl" onClick={() => onUpdate({ status: 'LUNAS' })}>
                    {t('admin.dmMarkLunas')}
                  </Button>
                )}
                {status === 'LUNAS' && (
                  <Button className="rounded-xl" onClick={() => onUpdate({ status: 'CHECKED_IN' })}>
                    {t('admin.dmMarkCheckedIn')}
                  </Button>
                )}
                <Button variant="outline" className="rounded-xl">
                  {t('admin.dmContactWa')}
                </Button>
                {canEdit && (
                  <Button variant="outline" className="rounded-xl" onClick={startEdit}>
                    {t('admin.dmEditBooking')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted mb-2 text-[11px] font-semibold tracking-[0.06em] uppercase">
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="text-muted text-xs">{label}</div>
      <div className={`font-semibold ${valueClass ?? ''}`}>{value}</div>
    </div>
  );
}
