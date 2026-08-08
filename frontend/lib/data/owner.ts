// Analitik dashboard Owner — dihitung dari `adminBookings` (mock, sama
// sumber datanya dengan Data Booking admin). TODO(FASE 10): ganti jadi
// query API analitik backend sungguhan, bukan hitung di client dari mock.
import {
  adminBookings,
  cmsRooms,
  occupiedQtyOnDate,
  type AdminBooking,
} from './admin';
import { roomSources } from './rooms';

export type DateRange = 'rangeToday' | 'rangeWeek' | 'rangeMonth' | 'rangeCustom';

/** Rentang tanggal manual (dari–sampai), dipakai saat `range === 'rangeCustom'`. */
export type CustomRange = { from: string; to: string };

/** Acuan periode yang dihitung — "sekarang" + rentang custom kalau ada. */
export type PeriodRef = { today: Date; custom?: CustomRange };

const DEFAULT_REF: PeriodRef = { today: new Date() };

const MONTH_LABELS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Senin sebagai awal minggu — konsisten dengan kalender okupansi Admin Overview. */
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7; // 0 = Senin
  d.setDate(d.getDate() - offset);
  return d;
}

function isValidCustomRange(custom?: CustomRange): custom is CustomRange {
  return !!custom?.from && !!custom?.to && custom.from <= custom.to;
}

/** Semua tanggal (ISO) yang termasuk dalam satu rentang. */
function datesInRange(range: DateRange, ref: PeriodRef): string[] {
  if (range === 'rangeCustom' && isValidCustomRange(ref.custom)) {
    const start = new Date(ref.custom.from);
    const end = new Date(ref.custom.to);
    const days: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(toISO(d));
    return days;
  }
  if (range === 'rangeToday') return [toISO(ref.today)];
  if (range === 'rangeWeek') {
    const start = startOfWeek(ref.today);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return toISO(d);
    });
  }
  // rangeMonth, atau rangeCustom yang belum diisi tanggalnya — pakai bulan berjalan.
  const year = ref.today.getFullYear();
  const month = ref.today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(year, month, i + 1)));
}

/** Label rentang tanggal yang lagi difilter, buat header laporan export (mis. "1 Jul 2026 – 26 Jul 2026"). */
export function periodRangeLabel(range: DateRange, ref: PeriodRef = DEFAULT_REF): string {
  const dates = datesInRange(range, ref);
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const first = dates[0];
  const last = dates[dates.length - 1];
  return first === last ? fmt(first) : `${fmt(first)} – ${fmt(last)}`;
}

/**
 * Booking yang tanggal check-in-nya masuk dalam rentang. Generik atas `T`
 * (cuma butuh `checkIn`, format `YYYY-MM-DD`) — dipakai Owner dashboard (mock
 * `AdminBooking`, default) maupun `BookingsPage.tsx` (data API asli, FASE 8/9).
 */
export function bookingsInRange<T extends { checkIn: string } = AdminBooking>(
  range: DateRange,
  ref: PeriodRef = DEFAULT_REF,
  bookings?: T[],
): T[] {
  const list = bookings ?? (adminBookings as unknown as T[]);
  const dates = new Set(datesInRange(range, ref));
  return list.filter((b) => dates.has(b.checkIn));
}

/** Geser acuan periode ke periode sebelumnya, durasi sama (buat bandingkan delta %). */
function previousPeriod(range: DateRange, ref: PeriodRef): PeriodRef {
  if (range === 'rangeCustom' && isValidCustomRange(ref.custom)) {
    const from = new Date(ref.custom.from);
    const to = new Date(ref.custom.to);
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - (spanDays - 1));
    return { today: ref.today, custom: { from: toISO(prevFrom), to: toISO(prevTo) } };
  }
  const d = new Date(ref.today);
  if (range === 'rangeToday') d.setDate(d.getDate() - 1);
  else if (range === 'rangeWeek') d.setDate(d.getDate() - 7);
  else d.setMonth(d.getMonth() - 1);
  return { today: d };
}

/**
 * Delta % vs periode sebelumnya. Kalau periode sebelumnya 0 (gak ada
 * baseline buat dibandingin), jangan tampilin persentase yang membingungkan
 * (mis. "100%+") — tandai `isNew` biar komponen nampilin label netral aja.
 */
function deltaPct(current: number, previous: number): { delta: string; up: boolean; isNew?: boolean } {
  if (previous === 0) {
    if (current === 0) return { delta: '0%', up: true };
    return { delta: '', up: true, isNew: true };
  }
  const pct = ((current - previous) / previous) * 100;
  return { delta: `${Math.abs(pct).toFixed(1)}%`, up: pct >= 0 };
}

function totalCapacity(): number {
  return cmsRooms.reduce((sum, r) => sum + r.units, 0);
}

function averageOccupancyPct(range: DateRange, ref: PeriodRef): number {
  const capacity = totalCapacity();
  if (capacity === 0) return 0;
  const dates = datesInRange(range, ref);
  const pct = dates.reduce((sum, d) => sum + occupiedQtyOnDate(adminBookings, d) / capacity, 0);
  return Math.round((pct / dates.length) * 100);
}

function formatRupiahShort(value: number): string {
  return `Rp${(value / 1_000_000).toFixed(1)} jt`;
}

/** 4 stat card Ringkasan Owner, dengan delta % vs periode sebelumnya. */
export function calcOwnerStats(range: DateRange, ref: PeriodRef = DEFAULT_REF) {
  const current = bookingsInRange(range, ref);
  const previous = bookingsInRange(range, previousPeriod(range, ref));

  const currentRevenue = current.reduce((sum, b) => sum + b.total, 0);
  const previousRevenue = previous.reduce((sum, b) => sum + b.total, 0);
  const currentVisitors = current.reduce((sum, b) => sum + b.adults + b.children, 0);
  const previousVisitors = previous.reduce((sum, b) => sum + b.adults + b.children, 0);
  const currentOccupancy = averageOccupancyPct(range, ref);
  const previousOccupancy = averageOccupancyPct(range, previousPeriod(range, ref));

  return [
    { key: 'statRevenue', value: formatRupiahShort(currentRevenue), ...deltaPct(currentRevenue, previousRevenue) },
    { key: 'statBooking', value: String(current.length), ...deltaPct(current.length, previous.length) },
    { key: 'statVisitors', value: String(currentVisitors), ...deltaPct(currentVisitors, previousVisitors) },
    { key: 'statOccupancy', value: `${currentOccupancy}%`, ...deltaPct(currentOccupancy, previousOccupancy) },
  ];
}

/** Tren pendapatan (juta rupiah) 6 bulan terakhir, dari bulan berjalan mundur. */
export function calcRevenueTrend(today: Date = new Date()): { m: string; v: number }[] {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`, label: MONTH_LABELS_ID[d.getMonth()] };
  });
  return months.map(({ key, label }) => ({
    m: label,
    v: Math.round(
      adminBookings.filter((b) => b.checkIn.slice(0, 7) === key).reduce((s, b) => s + b.total, 0) / 1_000_000,
    ),
  }));
}

/** Pendapatan per unit bisnis — Tiket Masuk & Cafe belum aktif (fase berikutnya, lihat PROJECT.md §1). */
export function calcUnitRevenue(range: DateRange, ref: PeriodRef = DEFAULT_REF) {
  const revenue = Math.round(bookingsInRange(range, ref).reduce((s, b) => s + b.total, 0) / 1_000_000);
  return [
    { label: 'Penginapan', value: revenue, active: true },
    { label: 'Tiket Masuk', value: 0, active: false },
    { label: 'Cafe', value: 0, active: false },
  ];
}

/**
 * Kontribusi 3 unit bisnis (Penginapan/Tiket Masuk/Cafe) buat donut Ringkasan.
 * Tiket & Cafe belum ada sistemnya (lihat PROJECT.md §1) jadi otomatis 0% —
 * Penginapan wajar tampil 100% sampai 2 unit lain aktif, bukan bug.
 */
export function calcRevenueByUnit(range: DateRange, ref: PeriodRef = DEFAULT_REF) {
  const inRange = bookingsInRange(range, ref);
  const revenue = inRange.reduce((s, b) => s + b.total, 0);
  return [
    { label: 'Penginapan', value: revenue, count: inRange.length, revenue, color: '#1B4332' },
    { label: 'Tiket Masuk', value: 0, count: 0, revenue: 0, color: '#D4A04A' },
    { label: 'Cafe', value: 0, count: 0, revenue: 0, color: '#6b4f3f' },
  ];
}

const DONUT_PALETTE = ['#1B4332', '#C1663F', '#8CA98F', '#2c5a8a', '#D4A04A', '#6b4f3f'];

/**
 * Sebaran booking per tipe tenda (6 unit asli, bukan nama fiktif lama).
 * `revenue` diaproksimasi proporsional per qty (sama seperti
 * `calcRoomTypePerformance`) — `total` di `AdminBooking` cuma satu angka
 * gabungan untuk booking multi-tipe, jadi ini estimasi, bukan pemisahan
 * harga presisi.
 */
export function calcBookingByType(range: DateRange, ref: PeriodRef = DEFAULT_REF) {
  const counts = new Map<string, number>();
  const revenues = new Map<string, number>();
  bookingsInRange(range, ref).forEach((b) => {
    const totalQty = b.rooms.reduce((s, r) => s + r.qty, 0);
    b.rooms.forEach((r) => {
      const name = roomSources.find((rs) => rs.slug === r.slug)?.name.id ?? r.slug;
      counts.set(name, (counts.get(name) ?? 0) + r.qty);
      const share = totalQty > 0 ? (b.total * r.qty) / totalQty : 0;
      revenues.set(name, (revenues.get(name) ?? 0) + share);
    });
  });
  return Array.from(counts.entries()).map(([label, value], i) => ({
    label,
    value,
    count: value,
    revenue: Math.round(revenues.get(label) ?? 0),
    color: DONUT_PALETTE[i % DONUT_PALETTE.length],
  }));
}

/** WhatsApp vs Walk-in — ganti "Online vs Walk-in" lama (booking online belum ada di Fase 1). */
export function calcBySource(range: DateRange, ref: PeriodRef = DEFAULT_REF) {
  const inRange = bookingsInRange(range, ref);
  const bySource = (source: AdminBooking['source']) => inRange.filter((b) => b.source === source);
  return [
    {
      label: 'WhatsApp',
      value: bySource('WHATSAPP').length,
      count: bySource('WHATSAPP').length,
      revenue: bySource('WHATSAPP').reduce((s, b) => s + b.total, 0),
      color: '#2c5a8a',
    },
    {
      label: 'Walk-in',
      value: bySource('WALK_IN').length,
      count: bySource('WALK_IN').length,
      revenue: bySource('WALK_IN').reduce((s, b) => s + b.total, 0),
      color: '#C1663F',
    },
  ];
}

/** Booking terbaru (bukan lagi campur transaksi Tiket Masuk fiktif — sistemnya belum ada, lihat PROJECT.md §1). */
export function calcRecentTransactions(count = 8): AdminBooking[] {
  return [...adminBookings].sort((a, b) => b.checkIn.localeCompare(a.checkIn)).slice(0, count);
}

export type RoomTypePerformance = {
  slug: string;
  name: string;
  category: string;
  totalUnits: number;
  bookingsCount: number;
  revenue: number;
};

/**
 * Performa per tipe tenda/villa — dipakai halaman Owner "Penginapan".
 * ⚠️ Pendapatan booking multi-tipe (>1 slug dalam satu booking, lihat
 * `BookingRoomItem`) **diaproksimasi proporsional per qty**, karena `total`
 * di `AdminBooking` cuma satu angka gabungan (belum ada subtotal per tipe
 * yang tersimpan) — jadi angka pendapatan per tipe di sini estimasi, bukan
 * pemisahan harga yang presisi.
 *
 * (Sengaja TIDAK menghitung okupansi per tipe di sini — rata-rata harian
 * sepanjang rentang bikin tipe yang jarang dipesan keliatan 0%/rendah,
 * padahal itu wajar buat bisnis yang masih berkembang. Lebih actionable buat
 * Owner cukup lihat Booking + Pendapatan; okupansi harian tetap ada di
 * Admin Overview yang memang buat operasional.)
 */
export function calcRoomTypePerformance(range: DateRange, ref: PeriodRef = DEFAULT_REF): RoomTypePerformance[] {
  const inRange = bookingsInRange(range, ref);

  return cmsRooms.map((room) => {
    let bookingsCount = 0;
    let revenue = 0;
    inRange.forEach((b) => {
      const roomItem = b.rooms.find((r) => r.slug === room.slug);
      if (!roomItem) return;
      bookingsCount += 1;
      const totalQty = b.rooms.reduce((s, r) => s + r.qty, 0);
      revenue += totalQty > 0 ? (b.total * roomItem.qty) / totalQty : 0;
    });

    return {
      slug: room.slug,
      name: room.name,
      category: room.category,
      totalUnits: room.units,
      bookingsCount,
      revenue: Math.round(revenue),
    };
  });
}
