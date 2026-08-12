'use client';

import {
  BedDouble,
  CalendarCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  DoorOpen,
  LogIn,
  Receipt,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, TBody, Td, Th, THead, Table, Tr } from '@/components/ui';
import { ApiError } from '@/lib/api/client';
import {
  fetchAdminBookings,
  updateBookingStatus,
  type AdminBookingDetail,
  type BookingStatusUpdate,
} from '@/lib/api/bookings';
import { fetchAdminRoomTypes, type AdminRoomTypeListItem } from '@/lib/api/roomTypes';
import { useAuth } from '@/lib/auth/AuthProvider';
import { cn } from '@/lib/cn';
import {
  occupiedQtyOnDate,
  roomsSummary,
  type AdminBooking,
  type BookingChannel,
  type BookingStoredStatus,
} from '@/lib/data/admin';
import { periodRangeLabel } from '@/lib/data/owner';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import {
  BookingDetailModal,
  displayStatus,
  toDisplay,
  type DisplayBooking,
} from './BookingDetailModal';
import { SourceBadge, StatusBadge } from './StatusBadge';

const WEEK = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

// Ringkasan cuma buat lihat sekilas, bukan tempat browsing data penuh (itu
// tugas Data Booking yang udah punya search/filter/pagination/export) —
// jadi tiap tabel dibatasi, sisanya diarahkan lewat link "Lihat semua".
const OVERVIEW_LIST_LIMIT = 10;

type OpsTab = 'arrivals' | 'inhouse' | 'departures';

function ViewAllLink({ show }: { show: boolean }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <Link
      href="/admin/penginapan/booking"
      className="shrink-0 text-xs font-semibold whitespace-nowrap text-green-700 hover:underline"
    >
      {t('admin.viewAllInBookings')} →
    </Link>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
}

/**
 * Bentuk `AdminBooking` (mock) dipetakan dari `AdminBookingDetail` (API) —
 * biar fungsi yang sudah ada (`occupiedQtyOnDate`, `bookingsOnDate`,
 * `getRecentBookings`, `effectiveStatus`) tetap kepakai apa adanya tanpa
 * ubah `lib/data/admin.ts` sama sekali (masih dipakai Dashboard Owner &
 * dropdown 2 form Tambah, di luar scope sesi ini). `adults`/`children`/
 * `extraBedQty` cuma buat memenuhi shape — Ringkasan gak pernah menampilkan
 * rincian per-item, cukup dijumlah kasar.
 */
function toOverviewBooking(b: AdminBookingDetail): AdminBooking {
  return {
    kode: b.bookingCode,
    guest: b.guestName,
    wa: b.guestPhone,
    rooms: b.items.map((i) => ({ slug: i.roomTypeSlug, qty: 1 })),
    createdAt: b.createdAt.slice(0, 10),
    checkIn: b.checkIn.slice(0, 10),
    checkOut: b.checkOut.slice(0, 10),
    source: b.bookingChannel as BookingChannel,
    total: b.priceSnapshot,
    status: b.status as BookingStoredStatus,
    adults: b.items.reduce((s, i) => s + i.adults, 0),
    children: b.items.reduce((s, i) => s + i.children, 0),
    extraBedQty: b.items.reduce((s, i) => s + i.extraBedQty, 0),
    hasKtpPhoto: false,
  };
}

export function OverviewPage() {
  const { t, locale } = useTranslation();
  const { token } = useAuth();
  const [selectedKode, setSelectedKode] = useState<string | null>(null);
  const [opsTab, setOpsTab] = useState<OpsTab>('arrivals');

  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [rawBookings, setRawBookings] = useState<AdminBookingDetail[] | null>(null);
  const [activeRoomTypes, setActiveRoomTypes] = useState<AdminRoomTypeListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(() => new Date().getMonth());
  // Satu-satunya sumber kebenaran tanggal. Dulu ada dua state terpisah
  // (`activeDate` dari input tanggal + `selectedDate` dari klik kalender):
  // klik tanggal di kalender cuma mengubah kotak ketersediaan, sementara
  // statistik & tabel tetap di tanggal lama — kelihatan seperti kalendernya
  // tidak berfungsi. Sekarang keduanya menggerakkan halaman yang sama.
  const [activeDate, setActiveDate] = useState<string>(() => {
    const now = new Date();
    return toISO(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      setLoadError(null);
      const [bookingList, roomTypes] = await Promise.all([
        fetchAdminBookings(token),
        fetchAdminRoomTypes(token),
      ]);
      setBookings(bookingList.map(toOverviewBooking));
      setRawBookings(bookingList);
      setActiveRoomTypes(roomTypes.filter((r) => r.isActive));
    } catch (e) {
      setLoadError(e instanceof ApiError ? e.message : t('admin.loadError'));
    }
  }, [token, t]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const today = new Date();
  const todayISO = toISO(today.getFullYear(), today.getMonth(), today.getDate());

  if (loadError) {
    return (
      <DashboardLayout title={t('dashboard.overview')}>
        <div className="border-border rounded-2xl border bg-white px-4 py-8 text-center">
          <p className="text-sm text-red-600">{loadError}</p>
          <button
            onClick={() => void refresh()}
            className="mt-2 text-sm font-semibold text-green-700 underline"
          >
            {t('admin.retry')}
          </button>
        </div>
      </DashboardLayout>
    );
  }

  if (bookings === null || rawBookings === null || activeRoomTypes === null) {
    return (
      <DashboardLayout title={t('dashboard.overview')}>
        <div className="border-border text-muted rounded-2xl border bg-white px-4 py-8 text-center text-sm">
          {t('admin.loading')}
        </div>
      </DashboardLayout>
    );
  }

  const totalCapacity = activeRoomTypes.reduce((sum, r) => sum + r.totalUnits, 0);

  function selectDate(iso: string) {
    if (!iso) return;
    setActiveDate(iso);
    const [y, m] = iso.split('-').map(Number);
    setCalendarYear(y);
    setCalendarMonthIndex(m - 1);
  }

  const fmt = (opts: Intl.DateTimeFormatOptions, iso: string) =>
    new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', opts).format(
      new Date(iso + 'T00:00:00'),
    );

  const activeDateShort = fmt({ day: 'numeric', month: 'long', year: 'numeric' }, activeDate);
  const activeDateLong = fmt(
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    activeDate,
  );

  const bookingsToday = bookings.filter((b) => b.checkIn === activeDate).length;
  const paidTransactions = rawBookings
    .flatMap((b) => b.payments)
    .filter((p): p is { amount: number; paidAt: string } => p.paidAt !== null);
  const revenueToday = paidTransactions
    .filter((p) => p.paidAt.slice(0, 10) === activeDate)
    .reduce((sum, p) => sum + p.amount, 0);
  const revenueThisMonth = paidTransactions
    .filter((p) => p.paidAt.slice(0, 7) === activeDate.slice(0, 7))
    .reduce((sum, p) => sum + p.amount, 0);

  const todayTransactions = rawBookings
    .filter((b) => b.createdAt.slice(0, 10) === activeDate)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(toDisplay);

  const stats: {
    label: string;
    value: string;
    sub: string;
    icon: LucideIcon;
    tint: string;
    iconColor: string;
  }[] = [
    {
      label: t('admin.overviewStatToday'),
      value: String(bookingsToday),
      sub: t('admin.arrivingToday'),
      icon: CalendarCheck,
      tint: 'bg-green-50',
      iconColor: 'text-green-700',
    },
    {
      label: t('admin.transactionsToday'),
      value: String(todayTransactions.length),
      sub: t('admin.recordedToday'),
      icon: Receipt,
      tint: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: t('admin.overviewStatRevenueToday'),
      value: formatIDR(revenueToday),
      sub: t('admin.fromTodayPayments'),
      icon: Wallet,
      tint: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
    {
      label: t('admin.overviewStatRevenue'),
      value: formatIDR(revenueThisMonth),
      sub: periodRangeLabel('rangeMonth', { today: new Date(activeDate + 'T00:00:00') }),
      icon: TrendingUp,
      tint: 'bg-orange-50',
      iconColor: 'text-orange-600',
    },
  ];

  // Tamu yang CHECK-IN hari ini (beda konsep dari `todayTransactions` di atas
  // yang berbasis tanggal booking DIBUAT) — buat admin reservasi nyiapin unit
  // SEBELUM tamunya datang. Diurutkan LUNAS → DP → CHECKED_IN: yang belum
  // check-in (masih perlu disiapin) muncul duluan, yang udah check-in (kamar
  // sudah ditempati, tinggal riwayat) ditaruh paling bawah. (Gak akan pernah
  // HANGUS/NO_SHOW di sini — tanggal checkout booking yang checkIn-nya hari
  // ini pasti belum lewat.)
  const CHECK_IN_TODAY_ORDER: Record<string, number> = { LUNAS: 0, DP: 1, CHECKED_IN: 2 };
  const checkInToday = rawBookings
    .filter((b) => b.checkIn.slice(0, 10) === activeDate)
    .sort((a, b) => {
      const orderDiff =
        (CHECK_IN_TODAY_ORDER[a.status] ?? 99) - (CHECK_IN_TODAY_ORDER[b.status] ?? 99);
      return orderDiff !== 0 ? orderDiff : a.guestName.localeCompare(b.guestName);
    })
    .map(toDisplay);

  // Diurutkan checkOut ascending — yang paling dekat pergi muncul duluan
  // biar admin tahu siapa yang perlu diperhatiin lebih awal. Pakai
  // `effectiveStatus` (bukan `status` mentah) — begitu tanggal checkout lewat
  // (relatif ke waktu sekarang, bukan `activeDate` yang lagi di-browse admin),
  // backend otomatis anggap COMPLETED walau admin belum sempat klik "Tandai
  // Selesai" manual. Kalau pakai `status` mentah, tamu yang udah efektif
  // Selesai masih nyangkut di sini padahal badge di tabel lain udah benar.
  const currentlyStaying = rawBookings
    .filter(
      (b) =>
        b.effectiveStatus === 'CHECKED_IN' &&
        b.checkIn.slice(0, 10) <= activeDate &&
        b.checkOut.slice(0, 10) >= activeDate,
    )
    .sort((a, b) => a.checkOut.localeCompare(b.checkOut))
    .map(toDisplay);

  // CHECKED_IN duluan — tamunya masih di dalam dan kamarnya perlu disiapkan
  // ulang setelah checkout. LUNAS/DP di bawah (edge case: booking yang
  // check-in & checkout sama hari ini tanpa sempat di-update statusnya).
  const CHECK_OUT_ORDER: Record<string, number> = { CHECKED_IN: 0, LUNAS: 1, DP: 2 };
  const checkOutToday = rawBookings
    .filter((b) => b.checkOut.slice(0, 10) === activeDate && b.status !== 'HANGUS')
    .sort((a, b) => {
      const orderDiff = (CHECK_OUT_ORDER[a.status] ?? 99) - (CHECK_OUT_ORDER[b.status] ?? 99);
      return orderDiff !== 0 ? orderDiff : a.guestName.localeCompare(b.guestName);
    })
    .map(toDisplay);

  // Tiga daftar operasional ini dulu jadi tiga kartu tabel terpisah yang
  // ditumpuk ke bawah — kolomnya nyaris sama persis, jadi halamannya panjang
  // & ketiganya kelihatan seragam. Digabung ke satu kartu bertab: jumlahnya
  // langsung kebaca di tab, dan admin gak perlu scroll jauh.
  const OPS_TABS: {
    key: OpsTab;
    label: string;
    icon: LucideIcon;
    rows: DisplayBooking[];
    empty: string;
  }[] = [
    {
      key: 'arrivals',
      label: t('admin.opsTabArrivals'),
      icon: LogIn,
      rows: checkInToday,
      empty: t('admin.noCheckInDate'),
    },
    {
      key: 'inhouse',
      label: t('admin.opsTabInHouse'),
      icon: BedDouble,
      rows: currentlyStaying,
      empty: t('admin.noCurrentlyStaying'),
    },
    {
      key: 'departures',
      label: t('admin.opsTabDepartures'),
      icon: DoorOpen,
      rows: checkOutToday,
      empty: t('admin.noCheckOutDate'),
    },
  ];
  const activeOps = OPS_TABS.find((tab) => tab.key === opsTab) ?? OPS_TABS[0];

  // Dicari langsung dari `rawBookings` (bukan cuma salah satu list di atas)
  // biar modal detail bisa dibuka dari tabel mana pun tanpa peduli booking-nya
  // ada di list yang mana.
  const selectedBookingRaw = rawBookings.find((b) => b.bookingCode === selectedKode) ?? null;
  const selectedBooking = selectedBookingRaw ? toDisplay(selectedBookingRaw) : null;

  async function handleUpdateStatus(newStatus: BookingStatusUpdate) {
    if (!selectedBooking || !token) return;
    await updateBookingStatus(token, selectedBooking.kode, newStatus);
    await refresh();
  }

  // Kalender: navigasi per-bulan, minggu mulai Senin (WEEK: S S R K J S M).
  const year = calendarYear;
  const monthIndex = calendarMonthIndex;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDayOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, monthIndex, 1));

  function prevMonth() {
    if (calendarMonthIndex === 0) {
      setCalendarYear((y) => y - 1);
      setCalendarMonthIndex(11);
    } else {
      setCalendarMonthIndex((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calendarMonthIndex === 11) {
      setCalendarYear((y) => y + 1);
      setCalendarMonthIndex(0);
    } else {
      setCalendarMonthIndex((m) => m + 1);
    }
  }

  const activeOccupied = occupiedQtyOnDate(bookings, activeDate);
  const occupancyPct =
    totalCapacity > 0 ? Math.round((activeOccupied / totalCapacity) * 100) : 0;

  return (
    <DashboardLayout title={t('dashboard.overview')}>
      {/* ── Tanggal aktif ─────────────────────────────────────────────── */}
      <div className="mb-4.5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-foreground font-serif text-base font-bold capitalize">
          {activeDateLong}
        </p>
        <div className="flex items-center gap-2">
          {/* Balik ke hari ini — dulu kalau admin sudah menjelajah ke tanggal
              lain, satu-satunya cara balik adalah memilih tanggalnya manual. */}
          {activeDate !== todayISO && (
            <button
              type="button"
              onClick={() => selectDate(todayISO)}
              className="border-input hover:bg-cream-100 h-10 rounded-lg border bg-white px-3 text-[13px] font-semibold transition-colors"
            >
              {t('admin.jumpToday')}
            </button>
          )}
          <div className="relative">
            <CalendarDays
              size={16}
              strokeWidth={1.75}
              className="text-muted pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2"
              aria-hidden
            />
            <input
              type="date"
              value={activeDate}
              onChange={(e) => selectDate(e.target.value)}
              className="border-input h-10 rounded-lg border bg-white pr-3.5 pl-9.5 text-sm font-medium focus:border-green-500 focus:ring-2 focus:ring-green-500/20 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Statistik ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4.5 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3.5 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted text-[11px] sm:text-[13px]">{s.label}</span>
                <span
                  className={cn(
                    'flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8',
                    s.tint,
                  )}
                >
                  <s.icon
                    size={14}
                    strokeWidth={1.75}
                    className={cn('sm:hidden', s.iconColor)}
                    aria-hidden
                  />
                  <s.icon
                    size={16}
                    strokeWidth={1.75}
                    className={cn('hidden sm:block', s.iconColor)}
                    aria-hidden
                  />
                </span>
              </div>
              <div className="mt-1.5 font-serif text-lg leading-tight font-extrabold whitespace-nowrap text-green-800 sm:text-2xl">
                {s.value}
              </div>
              <div className="text-muted mt-1 text-[10.5px] font-medium sm:text-xs">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Operasional harian (tab) ──────────────────────────────────── */}
      <Card className="mt-5.5">
        <CardContent>
          <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
            <div className="font-serif text-base font-bold">{t('admin.opsTitle')}</div>
            <ViewAllLink show={activeOps.rows.length > OVERVIEW_LIST_LIMIT} />
          </div>

          <div className="flex max-w-full gap-1.5 overflow-x-auto rounded-xl border border-[#e8e2d5] bg-white p-1.5">
            {OPS_TABS.map((tab) => {
              const active = tab.key === opsTab;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setOpsTab(tab.key)}
                  aria-pressed={active}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap transition-colors',
                    active ? 'bg-forest-700 text-white' : 'text-muted hover:bg-cream-100',
                  )}
                >
                  <tab.icon size={14} strokeWidth={1.9} aria-hidden />
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-px text-[11px] font-bold tabular-nums',
                      active ? 'bg-white/20 text-white' : 'bg-cream-100 text-muted',
                    )}
                  >
                    {tab.rows.length}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3.5">
            {activeOps.rows.length > 0 ? (
              <Table bare>
                <THead>
                  <Tr>
                    <Th>{t('admin.tCode')}</Th>
                    <Th>{t('admin.tGuest')}</Th>
                    <Th>{t('admin.tWa')}</Th>
                    <Th>{t('admin.tType')}</Th>
                    {opsTab === 'inhouse' ? (
                      <>
                        <Th>{t('admin.tCheckIn')}</Th>
                        <Th>{t('admin.tCheckOut')}</Th>
                      </>
                    ) : (
                      <>
                        <Th>{t('admin.tSource')}</Th>
                        <Th>{t('admin.tStatus')}</Th>
                      </>
                    )}
                  </Tr>
                </THead>
                <TBody>
                  {activeOps.rows.slice(0, OVERVIEW_LIST_LIMIT).map((b) => (
                    <Tr
                      key={b.kode}
                      onClick={() => setSelectedKode(b.kode)}
                      className="cursor-pointer"
                    >
                      <Td className="font-semibold whitespace-nowrap text-green-700">
                        {b.kode}
                      </Td>
                      <Td className="whitespace-nowrap">{b.guest}</Td>
                      <Td className="text-muted whitespace-nowrap">{b.wa}</Td>
                      <Td className="text-muted whitespace-nowrap">{roomsSummary(b.rooms)}</Td>
                      {opsTab === 'inhouse' ? (
                        <>
                          <Td className="text-muted whitespace-nowrap">
                            {fmt(
                              { day: 'numeric', month: 'short', year: 'numeric' },
                              b.raw.checkIn.slice(0, 10),
                            )}
                          </Td>
                          <Td className="text-muted whitespace-nowrap">
                            {fmt(
                              { day: 'numeric', month: 'short', year: 'numeric' },
                              b.raw.checkOut.slice(0, 10),
                            )}
                          </Td>
                        </>
                      ) : (
                        <>
                          <Td className="whitespace-nowrap">
                            <SourceBadge source={b.source} />
                          </Td>
                          <Td className="whitespace-nowrap">
                            <StatusBadge status={displayStatus(b)} />
                          </Td>
                        </>
                      )}
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                <activeOps.icon
                  size={26}
                  strokeWidth={1.4}
                  className="text-cream-400"
                  aria-hidden
                />
                <p className="text-muted text-[13px]">{activeOps.empty}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Transaksi + kalender ──────────────────────────────────────── */}
      <div className="mt-5.5 grid gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <Card className="min-w-0">
          <CardContent>
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-serif text-base font-bold">
                <Receipt size={17} strokeWidth={1.75} className="text-green-700" aria-hidden />
                {t('admin.transactionsDate', { date: activeDateShort })}
              </div>
              <ViewAllLink show={todayTransactions.length > OVERVIEW_LIST_LIMIT} />
            </div>
            {todayTransactions.length > 0 ? (
              <Table bare>
                <THead>
                  <Tr>
                    <Th>{t('admin.tTime')}</Th>
                    <Th>{t('admin.tCode')}</Th>
                    <Th>{t('admin.tGuest')}</Th>
                    <Th>{t('admin.tType')}</Th>
                    <Th>{t('admin.tSource')}</Th>
                    <Th>{t('admin.tStatus')}</Th>
                  </Tr>
                </THead>
                <TBody>
                  {todayTransactions.slice(0, OVERVIEW_LIST_LIMIT).map((b) => (
                    <Tr
                      key={b.kode}
                      onClick={() => setSelectedKode(b.kode)}
                      className="cursor-pointer"
                    >
                      <Td className="text-muted whitespace-nowrap">
                        {new Date(b.raw.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Td>
                      <Td className="font-semibold whitespace-nowrap text-green-700">
                        {b.kode}
                      </Td>
                      <Td className="whitespace-nowrap">{b.guest}</Td>
                      <Td className="text-muted whitespace-nowrap">{roomsSummary(b.rooms)}</Td>
                      <Td className="whitespace-nowrap">
                        <SourceBadge source={b.source} />
                      </Td>
                      <Td className="whitespace-nowrap">
                        <StatusBadge status={displayStatus(b)} />
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center gap-1.5 py-10 text-center">
                <Receipt size={26} strokeWidth={1.4} className="text-cream-400" aria-hidden />
                <p className="text-muted text-[13px]">{t('admin.noTransactionsDate')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 self-start">
          <CardContent>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="text-muted hover:text-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-stone-100"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={16} strokeWidth={2.2} aria-hidden />
              </button>
              <span className="font-serif text-sm font-bold capitalize">{monthLabel}</span>
              <button
                type="button"
                onClick={nextMonth}
                className="text-muted hover:text-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-stone-100"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={16} strokeWidth={2.2} aria-hidden />
              </button>
            </div>
            <div className="text-muted mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px]">
              {WEEK.map((d, i) => (
                <div key={i}>{d}</div>
              ))}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              {Array.from({ length: firstDayOffset }, (_, i) => (
                <div key={`pad-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateISO = toISO(year, monthIndex, day);
                const occupied = occupiedQtyOnDate(bookings, dateISO);
                const full = totalCapacity > 0 && occupied >= totalCapacity;
                const empty = occupied === 0;
                const isSelected = dateISO === activeDate;
                const isToday = dateISO === todayISO;
                return (
                  <button
                    key={day}
                    type="button"
                    // Klik tanggal sekarang menggerakkan SELURUH halaman
                    // (statistik, tab operasional, transaksi), bukan cuma
                    // kotak ketersediaan di bawah kalender.
                    onClick={() => selectDate(dateISO)}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-md text-[11px] font-medium transition-colors',
                      full
                        ? 'bg-stone-200 text-stone-400'
                        : empty
                          ? 'bg-green-50 text-green-700'
                          : 'bg-orange-50 text-orange-700',
                      isToday && 'outline-2 -outline-offset-2 outline-orange-500',
                      isSelected && 'ring-2 ring-green-700',
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="text-muted mt-3.5 flex flex-wrap items-center gap-3.5 text-[11.5px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-green-500" />
                {t('admin.available')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-orange-400" />
                {t('admin.partial')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] bg-stone-400" />
                {t('admin.full')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[3px] outline-2 -outline-offset-2 outline-orange-500" />
                {t('admin.today')}
              </span>
            </div>

            <div className="border-border mt-4 rounded-xl border p-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold capitalize">
                  {fmt({ day: 'numeric', month: 'long' }, activeDate)}
                </span>
                <span className="text-muted text-xs">
                  {t('admin.unitsOccupied', {
                    occupied: activeOccupied,
                    total: totalCapacity,
                  })}
                </span>
              </div>

              {/* Bar keterisian — angka "2 dari 30" doang susah dirasain
                  proporsinya sekilas. */}
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    occupancyPct >= 100
                      ? 'bg-stone-400'
                      : occupancyPct > 0
                        ? 'bg-orange-400'
                        : 'bg-green-500',
                  )}
                  style={{ width: `${Math.min(100, Math.max(occupancyPct, activeOccupied > 0 ? 4 : 0))}%` }}
                />
              </div>

              <div className="border-border mt-2.5 flex flex-col gap-1 border-t border-dashed pt-2.5">
                {activeRoomTypes.map((rt) => {
                  const occupiedType = occupiedQtyOnDate(bookings, activeDate, rt.slug);
                  const available = Math.max(0, rt.totalUnits - occupiedType);
                  const isFull = available === 0;
                  return (
                    <div key={rt.slug} className="flex items-center justify-between text-[12px]">
                      <span className={isFull ? 'text-muted' : 'text-foreground'}>{rt.name}</span>
                      <span
                        className={
                          isFull ? 'font-medium text-stone-400' : 'font-semibold text-green-700'
                        }
                      >
                        {isFull
                          ? t('admin.full')
                          : t('admin.unitsAvailable', { available, total: rt.totalUnits })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
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
