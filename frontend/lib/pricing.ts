/** Tipe unit yang bisa dipilih di form booking — dibentuk dari API admin (harga dari database, bukan data statis). */
export type BookableRoom = {
  id: number;
  slug: string;
  name: string;
  category: string;
  priceWeekday: number;
  priceWeekend: number;
  capacity: number;
  extraBedPrice?: number;
  extraNoBedPrice?: number;
  extraFlatPrice?: number;
};

export type ExtraBedType = 'with' | 'without';

/** Selisih malam antara check-in & check-out (0 kalau tanggal belum lengkap/valid). */
export function calcNights(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return Math.max(0, diff);
}

// Definisi weekend belum dikonfirmasi klien (PROJECT.md §11) — pakai asumsi
// Sabtu–Minggu sementara, sama seperti bagian lain situs.
function isWeekendDate(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Rincian jumlah malam weekday vs weekend dalam satu rentang menginap. */
export function calcNightsBreakdown(
  checkIn: string,
  checkOut: string,
): { weekdayNights: number; weekendNights: number } {
  if (!checkIn || !checkOut) return { weekdayNights: 0, weekendNights: 0 };
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  let weekdayNights = 0;
  let weekendNights = 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    if (isWeekendDate(d)) weekendNights += 1;
    else weekdayNights += 1;
  }
  return { weekdayNights, weekendNights };
}

/** Total harga sewa (bukan extra bed) untuk seluruh malam menginap, per tanggal weekday/weekend. */
export function calcStayPrice(
  room: Pick<BookableRoom, 'priceWeekday' | 'priceWeekend'>,
  checkIn: string,
  checkOut: string,
): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  let total = 0;
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    total += isWeekendDate(d) ? room.priceWeekend : room.priceWeekday;
  }
  return total;
}

/**
 * Tarif tambah orang PER MALAM (asumsi — price list tidak eksplisit sekali
 * bayar atau per malam, disamakan dengan harga sewa dasar yang jelas per
 * malam). Glorious Campervan pakai `extraFlatPrice` flat, unit lain pilih
 * `extraBedPrice`/`extraNoBedPrice` sesuai jenisnya.
 */
export function extraBedRate(
  room: Pick<BookableRoom, 'extraBedPrice' | 'extraNoBedPrice' | 'extraFlatPrice'>,
  type: ExtraBedType,
): number {
  return room.extraFlatPrice ?? (type === 'with' ? room.extraBedPrice : room.extraNoBedPrice) ?? 0;
}

export type PricedRoomGroup = {
  slug: string;
  extraBedQty: number;
  extraBedType: ExtraBedType;
};

/**
 * Subtotal satu unit tenda: sewa + tambahan orang (per malam). Satu baris
 * grup = satu unit fisik — kalau pesan beberapa unit tipe sama tapi isinya
 * beda-beda, tiap unit jadi barisnya sendiri (bukan satu baris dengan qty),
 * karena kebutuhan tiap unit (dewasa/anak/extra bed) bisa berbeda.
 */
export function calcGroupSubtotal(
  room: BookableRoom | undefined,
  group: PricedRoomGroup,
  checkIn: string,
  checkOut: string,
): number {
  if (!room) return 0;
  const nights = calcNights(checkIn, checkOut);
  const stay = calcStayPrice(room, checkIn, checkOut);
  const extra = group.extraBedQty > 0 ? extraBedRate(room, group.extraBedType) * group.extraBedQty * nights : 0;
  return stay + extra;
}

/** Total harga seluruh grup tenda dalam satu booking. */
export function calcGroupsTotal(
  rooms: BookableRoom[],
  groups: PricedRoomGroup[],
  checkIn: string,
  checkOut: string,
): number {
  return groups.reduce(
    (sum, g) => sum + calcGroupSubtotal(rooms.find((r) => r.slug === g.slug), g, checkIn, checkOut),
    0,
  );
}
