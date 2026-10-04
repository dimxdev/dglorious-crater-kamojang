// Tipe & util booking di sisi admin (dipetakan dari respons API booking).

/**
 * Asal booking — bukan `booking_source` (yang tetap `MANUAL` untuk
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
export type BookingStoredStatus = 'DP' | 'LUNAS' | 'CHECKED_IN' | 'HANGUS' | 'COMPLETED' | 'NO_SHOW';

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
export type BookingRoomItem = { slug: string; qty: number; name?: string; category?: string };

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
};

/** Label satu baris tenda: "Nama — Kategori" + "×N" kalau lebih dari 1. */
export function roomItemLabel(item: BookingRoomItem): string {
  const label = item.name ? (item.category ? `${item.name} — ${item.category}` : item.name) : item.slug;
  return item.qty > 1 ? `${label} ×${item.qty}` : label;
}

/** Versi ringkas `roomItemLabel` TANPA kategori — buat kolom sempit (mis. tabel di PDF export). */
export function roomItemShortLabel(item: BookingRoomItem): string {
  const label = item.name ?? item.slug;
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

/** Versi terpotong untuk kolom tabel — tampilkan tipe pertama, sisanya "+N lainnya". */
export function roomsSummaryTruncated(items: BookingRoomItem[]): string {
  if (items.length <= 1) return roomsSummary(items);
  return `${roomItemLabel(items[0])}, +${items.length - 1} lainnya`;
}

/**
 * Status turunan berbasis tanggal — lihat catatan di `BookingStatus`.
 * Satu tenggat yang sama untuk DP maupun LUNAS: tanggal **checkout**, bukan
 * check-in — dikasih toleransi penuh selama rentang menginapnya, siapa tahu
 * tamu masih datang di hari mana pun sebelum checkout.
 */
export function effectiveStatus(b: AdminBooking, today: Date = new Date()): BookingStatus {
  // Status tersimpan manual menang atas komputasi otomatis.
  if (b.status === 'COMPLETED') return 'COMPLETED';
  if (b.status === 'NO_SHOW') return 'NO_SHOW';
  const checkOut = new Date(b.checkOut);
  const pastCheckout = today > checkOut;
  if (b.status === 'CHECKED_IN') return pastCheckout ? 'COMPLETED' : 'CHECKED_IN';
  if (b.status === 'LUNAS' && pastCheckout) return 'NO_SHOW';
  if (b.status === 'DP' && pastCheckout) return 'HANGUS';
  return b.status;
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
    if (status === 'HANGUS' || status === 'NO_SHOW' || status === 'COMPLETED') return sum;
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);
    if (date >= checkIn && date < checkOut) {
      const rooms = roomSlug ? b.rooms.filter((r) => r.slug === roomSlug) : b.rooms;
      return sum + rooms.reduce((s, r) => s + r.qty, 0);
    }
    return sum;
  }, 0);
}

/** Label status booking (§6.2: DP → Lunas → Check-in → Selesai, cabang Hangus). */
export const statusLabelId: Record<BookingStatus, string> = {
  DP: 'DP',
  LUNAS: 'Lunas',
  CHECKED_IN: 'Check-in',
  COMPLETED: 'Selesai',
  HANGUS: 'Hangus',
  NO_SHOW: 'Tidak Datang',
};
