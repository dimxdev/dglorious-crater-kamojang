// Tipe & util reservasi di sisi admin (dipetakan dari respons API reservasi).

/**
 * Asal reservasi — bukan `reservation_source` (yang tetap `MANUAL` untuk
 * keduanya, lihat PROJECT.md §6.1), tapi menu mana yang dipakai admin:
 * "Reservasi" (menginap mulai hari ini atau nanti, DP atau Lunas) atau
 * "Langsung" (tamu menginap mulai hari ini, bayar penuh, langsung Check-in).
 * Field tampilan saja.
 */
export type ReservationChannel = 'RESERVASI' | 'LANGSUNG';

/**
 * Status yang benar-benar diubah admin secara manual (revisi 2026-07-26,
 * disederhanakan lagi hari yang sama): DP → LUNAS → CHECKED_IN, cabang
 * HANGUS kapan saja sebelum check-in — **tidak ada status "Dibatalkan"
 * terpisah**. Alasannya: dari sisi bisnis, batal-manual & no-show sama-sama
 * berarti "uang hangus, reservasi tidak jadi" (S&K poin 5), jadi cukup satu
 * konsep. Kanal LANGSUNG mulai dari CHECKED_IN (skip DP/LUNAS — sudah
 * bayar penuh & sudah di lokasi saat dicatat).
 */
export type ReservationStoredStatus = 'DP' | 'LUNAS' | 'CHECKED_IN' | 'HANGUS' | 'COMPLETED' | 'NO_SHOW';

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
 * (HANGUS sendiri juga bisa disimpan manual — admin batalkan reservasi
 * kapan saja sebelum check-in, tidak perlu nunggu tanggal apa pun.)
 */
export type ReservationStatus = ReservationStoredStatus | 'COMPLETED' | 'NO_SHOW';

export type ExtraBedType = 'with' | 'without';

/** Satu tipe tenda + jumlahnya dalam reservasi — satu reservasi bisa mencakup ≥1 tipe (PROJECT.md §10 `reservation_items`). */
export type ReservationRoomItem = { slug: string; qty: number; name?: string; category?: string };

export type AdminReservation = {
  kode: string;
  guest: string;
  wa: string;
  rooms: ReservationRoomItem[];
  /** Tanggal reservasi DIBUAT (beda dari `checkIn`) — buat Reservasi biasanya
   *  beberapa hari sebelum check-in (ada jeda nego di WA), buat Langsung
   *  selalu sama dengan `checkIn` (dicatat pas tamu datang langsung). */
  createdAt: string; // ISO
  checkIn: string; // ISO
  checkOut: string;
  source: ReservationChannel;
  total: number;
  status: ReservationStoredStatus;
  adults: number;
  children: number;
  extraBedQty: number;
  extraBedType?: ExtraBedType; // hanya relevan kalau extraBedQty > 0
  notes?: string;
};

/** Label satu baris tenda: "Nama — Kategori" + "×N" kalau lebih dari 1. */
export function roomItemLabel(item: ReservationRoomItem): string {
  const label = item.name ? (item.category ? `${item.name} — ${item.category}` : item.name) : item.slug;
  return item.qty > 1 ? `${label} ×${item.qty}` : label;
}

/** Versi ringkas `roomItemLabel` TANPA kategori — buat kolom sempit (mis. tabel di PDF export). */
export function roomItemShortLabel(item: ReservationRoomItem): string {
  const label = item.name ?? item.slug;
  return item.qty > 1 ? `${label} ×${item.qty}` : label;
}

/** Ringkasan semua tenda dalam satu reservasi, buat kolom tabel yang ringkas. */
export function roomsSummary(items: ReservationRoomItem[]): string {
  return items.map(roomItemLabel).join(', ');
}

/** Versi ringkas `roomsSummary` TANPA kategori — buat kolom sempit (mis. tabel di PDF export). */
export function roomsSummaryShort(items: ReservationRoomItem[]): string {
  return items.map(roomItemShortLabel).join(', ');
}

/** Versi terpotong untuk kolom tabel — tampilkan tipe pertama, sisanya "+N lainnya". */
export function roomsSummaryTruncated(items: ReservationRoomItem[]): string {
  if (items.length <= 1) return roomsSummary(items);
  return `${roomItemLabel(items[0])}, +${items.length - 1} lainnya`;
}

/**
 * Status turunan berbasis tanggal — lihat catatan di `ReservationStatus`.
 * Satu tenggat yang sama untuk DP maupun LUNAS: tanggal **checkout**, bukan
 * check-in — dikasih toleransi penuh selama rentang menginapnya, siapa tahu
 * tamu masih datang di hari mana pun sebelum checkout.
 */
export function effectiveStatus(b: AdminReservation, today: Date = new Date()): ReservationStatus {
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
 * Total unit yang lagi terpakai pada satu tanggal — reservasi yang `HANGUS`
 * atau `NO_SHOW` tidak dihitung (kamar sebenarnya kosong), tapi `DP`/`LUNAS`
 * yang belum check-in TETAP dihitung (unit sudah dikunci buat tanggal itu).
 * Kasih `roomSlug` buat hitung okupansi satu tipe tenda aja (dipakai laporan
 * performa per tipe di dashboard Owner).
 */
export function occupiedQtyOnDate(reservations: AdminReservation[], dateISO: string, roomSlug?: string): number {
  const date = new Date(dateISO);
  return reservations.reduce((sum, b) => {
    const status = effectiveStatus(b);
    // Selesai (COMPLETED) tetap dihitung: tamunya benar-benar menempati unit pada
    // tanggal itu. Yang tidak menempati hanya Hangus dan Tidak Datang (NO_SHOW).
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

/** Label status reservasi (§6.2: DP → Lunas → Check-in → Selesai, cabang Hangus). */
export const statusLabelId: Record<ReservationStatus, string> = {
  DP: 'DP',
  LUNAS: 'Lunas',
  CHECKED_IN: 'Check-in',
  COMPLETED: 'Selesai',
  HANGUS: 'Hangus',
  NO_SHOW: 'Tidak Datang',
};
