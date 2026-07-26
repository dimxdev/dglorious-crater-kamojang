// Data admin (MOCK). TODO(FASE 8/9): ganti dengan API booking backend.
import { roomSources } from './rooms';

/**
 * Asal booking Fase 1 — bukan `booking_source` (yang tetap `MANUAL` untuk
 * keduanya, lihat PROJECT.md §6.1), tapi menu mana yang dipakai admin:
 * "Booking WhatsApp" (tamu belum tiba, DP dulu) atau "Walk-in" (tamu sudah
 * di lokasi, langsung Check-in). Field tampilan saja.
 */
export type BookingChannel = 'WHATSAPP' | 'WALK_IN';

/**
 * Status yang benar-benar diubah admin secara manual (revisi 2026-07-26,
 * disederhanakan lagi hari yang sama): DP → LUNAS → CHECKED_IN, cabang
 * HANGUS kapan saja sebelum check-in — **tidak ada status "Dibatalkan"
 * terpisah**. Alasannya: dari sisi bisnis, batal-manual & no-show sama-sama
 * berarti "uang hangus, booking tidak jadi" (S&K poin 5), jadi cukup satu
 * konsep. Walk-in mulai langsung dari CHECKED_IN (skip DP/LUNAS — sudah
 * bayar penuh & sudah di lokasi saat dicatat).
 */
export type BookingStoredStatus = 'DP' | 'LUNAS' | 'CHECKED_IN' | 'HANGUS';

/**
 * Status yang TAMPIL ke admin — termasuk 2 status turunan yang dihitung
 * otomatis dari tanggal (bukan disimpan, bukan cron job — dihitung ulang
 * tiap halaman dibuka, lihat `effectiveStatus`). Satu aturan tenggat yang
 * SAMA untuk keduanya — **tunggu sampai tanggal checkout lewat** — cuma beda
 * label akhirnya tergantung sudah lunas atau belum:
 * - COMPLETED: sudah CHECKED_IN dan tanggal checkout sudah lewat.
 * - HANGUS (kalau masih DP): belum lunas & tanggal checkout sudah lewat
 *   tanpa pernah check-in — dianggap batal, uang hangus.
 * - NO_SHOW ("Tidak Datang", kalau sudah LUNAS): sudah bayar penuh tapi
 *   tanggal checkout lewat tanpa pernah check-in — uangnya aman, cuma
 *   tamunya yang nggak muncul.
 * (HANGUS sendiri juga bisa disimpan manual — admin batalkan booking
 * kapan saja sebelum check-in, tidak perlu nunggu tanggal apa pun.)
 */
export type BookingStatus = BookingStoredStatus | 'COMPLETED' | 'NO_SHOW';

export type ExtraBedType = 'with' | 'without';

/** Satu tipe tenda + jumlahnya dalam booking — satu booking bisa mencakup ≥1 tipe (PROJECT.md §10 `booking_items`). */
export type BookingRoomItem = { slug: string; qty: number };

export type AdminBooking = {
  kode: string;
  guest: string;
  wa: string;
  rooms: BookingRoomItem[];
  /** Tanggal booking DIBUAT (beda dari `checkIn`) — buat WhatsApp biasanya
   *  beberapa hari sebelum check-in (ada jeda nego di WA), buat Walk-in
   *  selalu sama dengan `checkIn` (dicatat pas tamu datang langsung). */
  createdAt: string; // ISO
  checkIn: string; // ISO
  checkOut: string;
  source: BookingChannel;
  total: number;
  status: BookingStoredStatus;
  adults: number;
  children: number;
  extraBedQty: number;
  extraBedType?: ExtraBedType; // hanya relevan kalau extraBedQty > 0
  notes?: string;
  /** Foto KTP cuma dikumpulkan di jalur Booking WhatsApp (§8.1) — walk-in tidak. */
  hasKtpPhoto: boolean;
};

/** Label satu baris tenda: "Nama — Kategori" + "×N" kalau lebih dari 1. */
export function roomItemLabel(item: BookingRoomItem): string {
  const source = roomSources.find((r) => r.slug === item.slug);
  const label = source ? `${source.name.id} — ${source.category.id}` : item.slug;
  return item.qty > 1 ? `${label} ×${item.qty}` : label;
}

/** Versi ringkas `roomItemLabel` TANPA kategori — buat kolom sempit (mis. tabel di PDF export). */
export function roomItemShortLabel(item: BookingRoomItem): string {
  const source = roomSources.find((r) => r.slug === item.slug);
  const label = source?.name.id ?? item.slug;
  return item.qty > 1 ? `${label} ×${item.qty}` : label;
}

/** Ringkasan semua tenda dalam satu booking, buat kolom tabel yang ringkas. */
export function roomsSummary(items: BookingRoomItem[]): string {
  return items.map(roomItemLabel).join(', ');
}

/** Versi ringkas `roomsSummary` TANPA kategori — buat kolom sempit (mis. tabel di PDF export). */
export function roomsSummaryShort(items: BookingRoomItem[]): string {
  return items.map(roomItemShortLabel).join(', ');
}

/**
 * Status turunan berbasis tanggal — lihat catatan di `BookingStatus`.
 * Satu tenggat yang sama untuk DP maupun LUNAS: tanggal **checkout**, bukan
 * check-in — dikasih toleransi penuh selama rentang menginapnya, siapa tahu
 * tamu masih datang di hari mana pun sebelum checkout.
 */
export function effectiveStatus(b: AdminBooking, today: Date = new Date()): BookingStatus {
  const checkOut = new Date(b.checkOut);
  const pastCheckout = today > checkOut;
  if (b.status === 'CHECKED_IN') return pastCheckout ? 'COMPLETED' : 'CHECKED_IN';
  if (b.status === 'LUNAS' && pastCheckout) return 'NO_SHOW';
  if (b.status === 'DP' && pastCheckout) return 'HANGUS';
  return b.status;
}

const [eagleHill, royalKahuripan, campJamuju, campRasamala, campCakrawala, campervan] = roomSources;

// Tanggal contoh dipilih relatif ke "hari ini" (2026-07-26) supaya
// effectiveStatus() menghasilkan variasi COMPLETED & HANGUS yang masuk akal.
export const adminBookings: AdminBooking[] = [
  { kode: 'DGC-48213', guest: 'Andini Rahmawati', wa: '0812-3456-7890', rooms: [{ slug: royalKahuripan.slug, qty: 1 }], createdAt: '2026-07-22', checkIn: '2026-07-30', checkOut: '2026-08-01', source: 'WHATSAPP', total: 2000000, status: 'DP', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  // Contoh pesan 2 tipe tenda BERBEDA dalam satu booking.
  { kode: 'DGC-48210', guest: 'Budi Santoso', wa: '0813-2211-9080', rooms: [{ slug: eagleHill.slug, qty: 1 }, { slug: royalKahuripan.slug, qty: 1 }], createdAt: '2026-07-10', checkIn: '2026-07-20', checkOut: '2026-07-23', source: 'WHATSAPP', total: 10497000, status: 'DP', adults: 4, children: 2, extraBedQty: 1, extraBedType: 'with', notes: 'Minta 2 unit bersebelahan, dekat pemandian air panas', hasKtpPhoto: true },
  { kode: 'DGC-48208', guest: 'Citra Lestari', wa: '0821-7788-1122', rooms: [{ slug: campJamuju.slug, qty: 1 }], createdAt: '2026-07-24', checkIn: '2026-07-24', checkOut: '2026-07-28', source: 'WALK_IN', total: 2400000, status: 'CHECKED_IN', adults: 4, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48201', guest: 'Dedi Kurniawan', wa: '0857-9900-3311', rooms: [{ slug: royalKahuripan.slug, qty: 1 }], createdAt: '2026-07-08', checkIn: '2026-07-15', checkOut: '2026-07-17', source: 'WHATSAPP', total: 2000000, status: 'CHECKED_IN', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  { kode: 'DGC-48197', guest: 'Eka Putri', wa: '0812-5566-7788', rooms: [{ slug: campRasamala.slug, qty: 1 }], createdAt: '2026-07-07', checkIn: '2026-07-14', checkOut: '2026-07-16', source: 'WHATSAPP', total: 1600000, status: 'HANGUS', adults: 3, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48190', guest: 'Fajar Nugroho', wa: '0838-1234-5566', rooms: [{ slug: campCakrawala.slug, qty: 1 }], createdAt: '2026-07-12', checkIn: '2026-07-12', checkOut: '2026-07-14', source: 'WALK_IN', total: 1200000, status: 'CHECKED_IN', adults: 2, children: 1, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48185', guest: 'Gita Savitri', wa: '0819-8877-6655', rooms: [{ slug: campervan.slug, qty: 1 }], createdAt: '2026-07-20', checkIn: '2026-07-29', checkOut: '2026-07-31', source: 'WHATSAPP', total: 350000, status: 'LUNAS', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  { kode: 'DGC-48180', guest: 'Hendra Wijaya', wa: '0811-2233-4455', rooms: [{ slug: eagleHill.slug, qty: 1 }], createdAt: '2026-07-01', checkIn: '2026-07-10', checkOut: '2026-07-12', source: 'WHATSAPP', total: 3998000, status: 'HANGUS', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48175', guest: 'Indah Permata', wa: '0852-6677-8899', rooms: [{ slug: campJamuju.slug, qty: 1 }], createdAt: '2026-07-24', checkIn: '2026-08-02', checkOut: '2026-08-04', source: 'WHATSAPP', total: 2400000, status: 'DP', adults: 3, children: 1, extraBedQty: 1, extraBedType: 'without', notes: 'Anak masih 4 tahun, tidak perlu extra bed terpisah', hasKtpPhoto: true },
  // Baris tambahan (2026-07-26) — supaya pagination & filter bulan ada yang
  // benar-benar dipaginasi/difilter, bukan cuma 9 baris yang muat 1 halaman.
  { kode: 'DGC-48170', guest: 'Joko Prasetyo', wa: '0813-4455-6677', rooms: [{ slug: campRasamala.slug, qty: 1 }], createdAt: '2026-05-28', checkIn: '2026-06-05', checkOut: '2026-06-07', source: 'WHATSAPP', total: 1600000, status: 'CHECKED_IN', adults: 4, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  { kode: 'DGC-48168', guest: 'Kartika Sari', wa: '0821-9900-1122', rooms: [{ slug: eagleHill.slug, qty: 1 }], createdAt: '2026-05-30', checkIn: '2026-06-08', checkOut: '2026-06-10', source: 'WHATSAPP', total: 3998000, status: 'CHECKED_IN', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  { kode: 'DGC-48165', guest: 'Lukman Hakim', wa: '0857-3344-5566', rooms: [{ slug: campCakrawala.slug, qty: 1 }], createdAt: '2026-06-12', checkIn: '2026-06-12', checkOut: '2026-06-13', source: 'WALK_IN', total: 600000, status: 'CHECKED_IN', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48162', guest: 'Melati Wulandari', wa: '0812-6677-8899', rooms: [{ slug: royalKahuripan.slug, qty: 1 }], createdAt: '2026-06-05', checkIn: '2026-06-15', checkOut: '2026-06-17', source: 'WHATSAPP', total: 2000000, status: 'HANGUS', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48159', guest: 'Nanda Ramadhan', wa: '0838-2233-4455', rooms: [{ slug: campJamuju.slug, qty: 1 }], createdAt: '2026-06-10', checkIn: '2026-06-18', checkOut: '2026-06-20', source: 'WHATSAPP', total: 2400000, status: 'CHECKED_IN', adults: 3, children: 2, extraBedQty: 1, extraBedType: 'with', hasKtpPhoto: true },
  { kode: 'DGC-48156', guest: 'Oki Setiawan', wa: '0819-1122-3344', rooms: [{ slug: campervan.slug, qty: 1 }], createdAt: '2026-06-20', checkIn: '2026-06-20', checkOut: '2026-06-21', source: 'WALK_IN', total: 350000, status: 'CHECKED_IN', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48153', guest: 'Putri Ayu Lestari', wa: '0811-5566-7788', rooms: [{ slug: eagleHill.slug, qty: 1 }], createdAt: '2026-06-12', checkIn: '2026-06-22', checkOut: '2026-06-24', source: 'WHATSAPP', total: 3998000, status: 'CHECKED_IN', adults: 2, children: 0, extraBedQty: 0, notes: 'Anniversary, minta dekorasi sederhana kalau bisa', hasKtpPhoto: true },
  // Contoh pesan 5 tenda tipe yang SAMA (rombongan) dalam satu booking.
  { kode: 'DGC-48150', guest: 'Qori Amelia', wa: '0852-9988-7766', rooms: [{ slug: campRasamala.slug, qty: 5 }], createdAt: '2026-06-01', checkIn: '2026-06-26', checkOut: '2026-06-28', source: 'WHATSAPP', total: 8000000, status: 'CHECKED_IN', adults: 18, children: 2, extraBedQty: 0, notes: 'Rombongan gathering kantor, 20 orang', hasKtpPhoto: true },
  { kode: 'DGC-48147', guest: 'Rian Firmansyah', wa: '0813-7788-9900', rooms: [{ slug: royalKahuripan.slug, qty: 1 }], createdAt: '2026-06-27', checkIn: '2026-06-27', checkOut: '2026-06-29', source: 'WALK_IN', total: 2000000, status: 'CHECKED_IN', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48220', guest: 'Sinta Dewi', wa: '0821-3344-5566', rooms: [{ slug: campCakrawala.slug, qty: 1 }], createdAt: '2026-07-18', checkIn: '2026-07-27', checkOut: '2026-07-29', source: 'WHATSAPP', total: 1200000, status: 'LUNAS', adults: 3, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  // Contoh toleransi DP: tanggal check-in (20 Jul) sudah lewat tapi checkout
  // (29 Jul) belum — tetap tampil DP, BUKAN Hangus, sampai checkout lewat.
  { kode: 'DGC-48222', guest: 'Taufik Hidayat', wa: '0857-6677-8899', rooms: [{ slug: campJamuju.slug, qty: 1 }], createdAt: '2026-07-10', checkIn: '2026-07-20', checkOut: '2026-07-29', source: 'WHATSAPP', total: 2400000, status: 'DP', adults: 4, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  { kode: 'DGC-48224', guest: 'Utari Ningsih', wa: '0812-2233-4455', rooms: [{ slug: eagleHill.slug, qty: 1 }], createdAt: '2026-07-25', checkIn: '2026-07-25', checkOut: '2026-07-27', source: 'WALK_IN', total: 3998000, status: 'CHECKED_IN', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48226', guest: 'Vino Bastian', wa: '0838-8899-0011', rooms: [{ slug: royalKahuripan.slug, qty: 1 }], createdAt: '2026-07-23', checkIn: '2026-07-31', checkOut: '2026-08-02', source: 'WHATSAPP', total: 2000000, status: 'DP', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  // Contoh HANGUS: checkout sudah lewat (09 Jul) tapi status masih DP — tidak pernah check-in.
  { kode: 'DGC-48228', guest: 'Wulan Guritno', wa: '0819-4455-6677', rooms: [{ slug: campervan.slug, qty: 1 }], createdAt: '2026-06-30', checkIn: '2026-07-08', checkOut: '2026-07-09', source: 'WHATSAPP', total: 350000, status: 'DP', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  // Contoh NO_SHOW: sudah LUNAS, checkout (17 Jul) sudah lewat, tapi tidak pernah check-in.
  { kode: 'DGC-48240', guest: 'Dimas Prakoso', wa: '0812-7788-3344', rooms: [{ slug: campCakrawala.slug, qty: 1 }], createdAt: '2026-07-06', checkIn: '2026-07-16', checkOut: '2026-07-17', source: 'WHATSAPP', total: 600000, status: 'LUNAS', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  { kode: 'DGC-48230', guest: 'Yusuf Maulana', wa: '0811-9900-1122', rooms: [{ slug: campRasamala.slug, qty: 1 }], createdAt: '2026-07-25', checkIn: '2026-08-05', checkOut: '2026-08-07', source: 'WHATSAPP', total: 1600000, status: 'DP', adults: 3, children: 1, extraBedQty: 0, hasKtpPhoto: true },
  { kode: 'DGC-48232', guest: 'Zahra Anindya', wa: '0852-1122-3344', rooms: [{ slug: campCakrawala.slug, qty: 1 }], createdAt: '2026-08-08', checkIn: '2026-08-08', checkOut: '2026-08-09', source: 'WALK_IN', total: 600000, status: 'CHECKED_IN', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: false },
  { kode: 'DGC-48234', guest: 'Agus Salim', wa: '0813-5566-7788', rooms: [{ slug: campJamuju.slug, qty: 1 }], createdAt: '2026-08-01', checkIn: '2026-08-10', checkOut: '2026-08-12', source: 'WHATSAPP', total: 2400000, status: 'LUNAS', adults: 4, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  { kode: 'DGC-48236', guest: 'Bunga Citra', wa: '0821-6677-8899', rooms: [{ slug: eagleHill.slug, qty: 1 }], createdAt: '2026-08-04', checkIn: '2026-08-14', checkOut: '2026-08-16', source: 'WHATSAPP', total: 3998000, status: 'DP', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: true },
  { kode: 'DGC-48238', guest: 'Chandra Wijaya', wa: '0857-2233-4455', rooms: [{ slug: royalKahuripan.slug, qty: 1 }], createdAt: '2026-08-09', checkIn: '2026-08-18', checkOut: '2026-08-20', source: 'WHATSAPP', total: 2000000, status: 'DP', adults: 2, children: 0, extraBedQty: 0, hasKtpPhoto: true },
];

/** N booking terbaru berdasarkan tanggal check-in (paling akhir dulu). */
export function getRecentBookings(bookings: AdminBooking[], count = 5): AdminBooking[] {
  return [...bookings].sort((a, b) => b.checkIn.localeCompare(a.checkIn)).slice(0, count);
}

/**
 * Total unit yang lagi terpakai pada satu tanggal — booking yang `HANGUS`
 * atau `NO_SHOW` tidak dihitung (kamar sebenarnya kosong), tapi `DP`/`LUNAS`
 * yang belum check-in TETAP dihitung (unit sudah dikunci buat tanggal itu).
 * Kasih `roomSlug` buat hitung okupansi satu tipe tenda aja (dipakai laporan
 * performa per tipe di dashboard Owner).
 */
export function occupiedQtyOnDate(bookings: AdminBooking[], dateISO: string, roomSlug?: string): number {
  const date = new Date(dateISO);
  return bookings.reduce((sum, b) => {
    const status = effectiveStatus(b);
    if (status === 'HANGUS' || status === 'NO_SHOW') return sum;
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    if (date >= checkIn && date < checkOut) {
      const rooms = roomSlug ? b.rooms.filter((r) => r.slug === roomSlug) : b.rooms;
      return sum + rooms.reduce((s, r) => s + r.qty, 0);
    }
    return sum;
  }, 0);
}

/** Semua booking yang mencakup satu tanggal tertentu (buat detail kalender, lihat catatan `occupiedQtyOnDate`). */
export function bookingsOnDate(bookings: AdminBooking[], dateISO: string): AdminBooking[] {
  const date = new Date(dateISO);
  return bookings.filter((b) => {
    const status = effectiveStatus(b);
    if (status === 'HANGUS' || status === 'NO_SHOW') return false;
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    return date >= checkIn && date < checkOut;
  });
}

/** Ringkasan CMS penginapan (dari data rooms). */
export const cmsRooms = roomSources.map((r) => ({
  slug: r.slug,
  name: r.name.id,
  category: r.category.id,
  priceWeekday: r.priceWeekday,
  priceWeekend: r.priceWeekend,
  capacity: r.capacity,
  units: r.totalUnits,
  active: true,
  icon: r.coverIcon,
}));

/** Label status booking Fase 1 (§6.2, revisi 2026-07-26: DP → Lunas → Check-in → Selesai, cabang Hangus). */
export const statusLabelId: Record<BookingStatus, string> = {
  DP: 'DP',
  LUNAS: 'Lunas',
  CHECKED_IN: 'Check-in',
  COMPLETED: 'Selesai',
  HANGUS: 'Hangus',
  NO_SHOW: 'Tidak Datang',
};
