'use client';

import {
  BedDouble,
  CalendarCheck,
  CalendarDays,
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
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { BookingDetailModal, displayStatus, toDisplay } from './BookingDetailModal';
import { SourceBadge, StatusBadge } from './StatusBadge';

const WEEK = ['S', 'S', 'R', 'K', 'J', 'S', 'M'];

// Ringkasan cuma buat lihat sekilas, bukan tempat browsing data penuh (itu
// tugas Data Booking yang udah punya search/filter/pagination/export) —
// jadi tiap tabel dibatasi, sisanya diarahkan lewat link "Lihat semua".
const OVERVIEW_LIST_LIMIT = 10;

function ViewAllLink({ show }: { show: boolean }) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <Link
      href="/admin/penginapan/booking"
      className="text-green-700 shrink-0 text-xs font-semibold whitespace-nowrap hover:underline"
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
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const now = new Date();
    return toISO(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [selectedKode, setSelectedKode] = useState<string | null>(null);

  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [rawBookings, setRawBookings] = useState<AdminBookingDetail[] | null>(null);
  const [activeRoomTypes, setActiveRoomTypes] = useState<AdminRoomTypeListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());
  const [calendarMonthIndex, setCalendarMonthIndex] = useState(() => new Date().getMonth());
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
  const todayMonth = todayISO.slice(0, 7);

  if (loadError) {
    return (
      <DashboardLayout title={t('dashboard.overview')}>
        <div className="border-border rounded-2xl border bg-white px-4 py-8 text-center">
          <p className="text-sm text-red-600">{loadError}</p>
          <button onClick={() => void refresh()} className="text-green-700 mt-2 text-sm font-semibold underline">
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

  function handleDateChange(iso: string) {
    if (!iso) return;
    setActiveDate(iso);
    const [y, m] = iso.split('-').map(Number);
    setCalendarYear(y);
    setCalendarMonthIndex(m - 1);
  }

  const activeDateParsed = new Date(activeDate + 'T00:00:00');
  const activeDateShort = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric', month: 'long', year: 'numeric',
  }).format(activeDateParsed);
  const activeDateLong = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(activeDateParsed);
  const activeMonthLabel = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    month: 'long', year: 'numeric',
  }).format(activeDateParsed);

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

  const stats: { label: string; value: string; sub: string; icon: LucideIcon; tint: string; iconColor: string }[] = [
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
      sub: t('admin.thisMonth'),
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
      const orderDiff = (CHECK_IN_TODAY_ORDER[a.status] ?? 99) - (CHECK_IN_TODAY_ORDER[b.status] ?? 99);
      return orderDiff !== 0 ? orderDiff : a.guestName.localeCompare(b.guestName);
    })
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

  // Dicari langsung dari `rawBookings` (bukan cuma salah satu list di atas)
  // biar modal detail bisa dibuka dari tabel Transaksi Hari Ini MAUPUN
  // Check-in Hari Ini tanpa peduli booking-nya ada di list yang mana.
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

  const selectedOccupied = selectedDate ? occupiedQtyOnDate(bookings, selectedDate) : 0;

  return (
    <DashboardLayout title={t('dashboard.overview')}>
      {/* Date filter */}
      <div className="mb-4.5 flex items-center justify-between gap-3">
        <p className="text-foreground font-serif text-sm font-semibold capitalize">{activeDateLong}</p>
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
            onChange={(e) => handleDateChange(e.target.value)}
            className="border-input focus:border-green-500 focus:ring-green-500/20 h-10 rounded-full border bg-white pr-3.5 pl-9.5 text-sm font-medium focus:ring-2 focus:outline-none"
          />
        </div>
      </div>

      {/* Stat cards */}
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
                  <s.icon size={14} strokeWidth={1.75} className={cn('sm:hidden', s.iconColor)} aria-hidden />
                  <s.icon
                    size={16}
                    strokeWidth={1.75}
                    className={cn('hidden sm:block', s.iconColor)}
                    aria-hidden
                  />
                </span>
              </div>
              <div className="text-green-800 mt-1.5 font-serif text-lg leading-tight font-extrabold whitespace-nowrap sm:text-2xl">
                {s.value}
              </div>
              <div className="text-muted mt-1 text-[10.5px] font-medium sm:text-xs">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent + calendar */}
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
                    <Tr key={b.kode} onClick={() => setSelectedKode(b.kode)} className="cursor-pointer">
                      <Td className="text-muted whitespace-nowrap">
                        {new Date(b.raw.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Td>
                      <Td className="text-green-700 font-semibold whitespace-nowrap">{b.kode}</Td>
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
              <p className="text-muted text-[13px]">{t('admin.noTransactionsDate')}</p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0 self-start">
          <CardContent>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={prevMonth}
                className="text-muted hover:text-foreground hover:bg-stone-100 flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                aria-label="Bulan sebelumnya"
              >
                ‹
              </button>
              <span className="font-serif text-sm font-bold capitalize">{monthLabel}</span>
              <button
                type="button"
                onClick={nextMonth}
                className="text-muted hover:text-foreground hover:bg-stone-100 flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
                aria-label="Bulan berikutnya"
              >
                ›
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
                const isSelected = dateISO === selectedDate;
                const isToday = dateISO === todayISO;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDate(dateISO)}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-md text-[11px] font-medium transition-colors',
                      full ? 'bg-stone-200 text-stone-400' : empty ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700',
                      isToday && 'outline-orange-500 outline-2 -outline-offset-2',
                      isSelected && 'ring-green-700 ring-2',
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="text-muted mt-3.5 flex flex-wrap items-center gap-3.5 text-[11.5px]">
              <span className="flex items-center gap-1.5">
                <span className="bg-green-500 h-2.5 w-2.5 rounded-[3px]" />
                {t('admin.available')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-orange-400 h-2.5 w-2.5 rounded-[3px]" />
                {t('admin.partial')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-stone-400 h-2.5 w-2.5 rounded-[3px]" />
                {t('admin.full')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="outline-orange-500 h-2.5 w-2.5 rounded-[3px] outline-2 -outline-offset-2" />
                {t('admin.today')}
              </span>
            </div>

            {selectedDate && (
              <div className="border-border mt-4 rounded-xl border p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    {new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
                      day: 'numeric',
                      month: 'long',
                    }).format(new Date(selectedDate))}
                  </span>
                  <span className="text-muted text-xs">
                    {t('admin.unitsOccupied', { occupied: selectedOccupied, total: totalCapacity })}
                  </span>
                </div>

                <div className="border-border mt-2.5 flex flex-col gap-1 border-t border-dashed pt-2.5">
                  {activeRoomTypes.map((rt) => {
                    const occupiedType = occupiedQtyOnDate(bookings, selectedDate, rt.slug);
                    const available = Math.max(0, rt.totalUnits - occupiedType);
                    const isFull = available === 0;
                    return (
                      <div key={rt.slug} className="flex items-center justify-between text-[12px]">
                        <span className={isFull ? 'text-muted' : 'text-foreground'}>{rt.name}</span>
                        <span className={isFull ? 'text-stone-400 font-medium' : 'text-green-700 font-semibold'}>
                          {isFull
                            ? t('admin.full')
                            : t('admin.unitsAvailable', { available, total: rt.totalUnits })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in hari ini — buat admin reservasi nyiapin unit sebelum tamunya datang. */}
      <Card className="mt-5.5">
        <CardContent>
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-serif text-base font-bold">
              <LogIn size={17} strokeWidth={1.75} className="text-green-700" aria-hidden />
              {t('admin.checkInDate', { date: activeDateShort })}
            </div>
            <ViewAllLink show={checkInToday.length > OVERVIEW_LIST_LIMIT} />
          </div>
          {checkInToday.length > 0 ? (
            <Table bare>
              <THead>
                <Tr>
                  <Th>{t('admin.tCode')}</Th>
                  <Th>{t('admin.tGuest')}</Th>
                  <Th>{t('admin.tWa')}</Th>
                  <Th>{t('admin.tType')}</Th>
                  <Th>{t('admin.tSource')}</Th>
                  <Th>{t('admin.tStatus')}</Th>
                </Tr>
              </THead>
              <TBody>
                {checkInToday.slice(0, OVERVIEW_LIST_LIMIT).map((b) => (
                  <Tr key={b.kode} onClick={() => setSelectedKode(b.kode)} className="cursor-pointer">
                    <Td className="text-green-700 font-semibold whitespace-nowrap">{b.kode}</Td>
                    <Td className="whitespace-nowrap">{b.guest}</Td>
                    <Td className="text-muted whitespace-nowrap">{b.wa}</Td>
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
            <p className="text-muted text-[13px]">{t('admin.noCheckInDate')}</p>
          )}
        </CardContent>
      </Card>

      {/* Tamu sedang menginap — CHECKED_IN yang rentang tanggalnya mencakup activeDate. */}
      <Card className="mt-5.5">
        <CardContent>
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-serif text-base font-bold">
              <BedDouble size={17} strokeWidth={1.75} className="text-green-700" aria-hidden />
              {t('admin.currentlyStaying')}
            </div>
            <ViewAllLink show={currentlyStaying.length > OVERVIEW_LIST_LIMIT} />
          </div>
          {currentlyStaying.length > 0 ? (
            <Table bare>
              <THead>
                <Tr>
                  <Th>{t('admin.tCode')}</Th>
                  <Th>{t('admin.tGuest')}</Th>
                  <Th>{t('admin.tWa')}</Th>
                  <Th>{t('admin.tType')}</Th>
                  <Th>{t('admin.tCheckIn')}</Th>
                  <Th>{t('admin.tCheckOut')}</Th>
                </Tr>
              </THead>
              <TBody>
                {currentlyStaying.slice(0, OVERVIEW_LIST_LIMIT).map((b) => (
                  <Tr key={b.kode} onClick={() => setSelectedKode(b.kode)} className="cursor-pointer">
                    <Td className="text-green-700 font-semibold whitespace-nowrap">{b.kode}</Td>
                    <Td className="whitespace-nowrap">{b.guest}</Td>
                    <Td className="text-muted whitespace-nowrap">{b.wa}</Td>
                    <Td className="text-muted whitespace-nowrap">{roomsSummary(b.rooms)}</Td>
                    <Td className="text-muted whitespace-nowrap">
                      {new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      }).format(new Date(b.raw.checkIn.slice(0, 10) + 'T00:00:00'))}
                    </Td>
                    <Td className="text-muted whitespace-nowrap">
                      {new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      }).format(new Date(b.raw.checkOut.slice(0, 10) + 'T00:00:00'))}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <p className="text-muted text-[13px]">{t('admin.noCurrentlyStaying')}</p>
          )}
        </CardContent>
      </Card>

      {/* Check-out hari ini — kamar yang perlu disiapkan ulang setelah tamu pergi. */}
      <Card className="mt-5.5">
        <CardContent>
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-serif text-base font-bold">
              <DoorOpen size={17} strokeWidth={1.75} className="text-green-700" aria-hidden />
              {t('admin.checkOutDate', { date: activeDateShort })}
            </div>
            <ViewAllLink show={checkOutToday.length > OVERVIEW_LIST_LIMIT} />
          </div>
          {checkOutToday.length > 0 ? (
            <Table bare>
              <THead>
                <Tr>
                  <Th>{t('admin.tCode')}</Th>
                  <Th>{t('admin.tGuest')}</Th>
                  <Th>{t('admin.tWa')}</Th>
                  <Th>{t('admin.tType')}</Th>
                  <Th>{t('admin.tSource')}</Th>
                  <Th>{t('admin.tStatus')}</Th>
                </Tr>
              </THead>
              <TBody>
                {checkOutToday.slice(0, OVERVIEW_LIST_LIMIT).map((b) => (
                  <Tr key={b.kode} onClick={() => setSelectedKode(b.kode)} className="cursor-pointer">
                    <Td className="text-green-700 font-semibold whitespace-nowrap">{b.kode}</Td>
                    <Td className="whitespace-nowrap">{b.guest}</Td>
                    <Td className="text-muted whitespace-nowrap">{b.wa}</Td>
                    <Td className="text-muted whitespace-nowrap">{roomsSummary(b.rooms)}</Td>
                    <Td className="whitespace-nowrap"><SourceBadge source={b.source} /></Td>
                    <Td className="whitespace-nowrap"><StatusBadge status={displayStatus(b)} /></Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <p className="text-muted text-[13px]">{t('admin.noCheckOutDate')}</p>
          )}
        </CardContent>
      </Card>

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
