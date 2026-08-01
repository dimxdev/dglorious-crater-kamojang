/**
 * Pure pricing helpers — MUST stay in lockstep with `frontend/lib/pricing.ts`.
 * Both sides implement the same interim assumptions (§11 PROJECT.md, not yet
 * confirmed by the client): weekend = Saturday–Sunday, extra-bed rate is
 * charged per night.
 */

export type StayPriceInput = {
  priceWeekday: number;
  priceWeekend: number;
};

export type ExtraBedRateInput = {
  extraBedPrice: number | null;
  extraNoBedPrice: number | null;
  extraFlatPrice: number | null;
};

function isWeekendDate(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Nights between two dates (0 if invalid/reversed). */
export function calcNights(checkIn: Date, checkOut: Date): number {
  const diff = Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
  return Math.max(0, diff);
}

/** Sum of per-night rates (weekday/weekend) over [checkIn, checkOut). */
export function calcStayPrice(
  room: StayPriceInput,
  checkIn: Date,
  checkOut: Date,
): number {
  let total = 0;
  for (const d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
    total += isWeekendDate(d) ? room.priceWeekend : room.priceWeekday;
  }
  return total;
}

/**
 * Per-night extra-person rate. `extraFlatPrice` (Glorious Campervan) wins if
 * set; otherwise pick with/without-bed rate. See RoomType schema comment.
 */
export function extraBedRate(
  room: ExtraBedRateInput,
  type: 'WITH_BED' | 'WITHOUT_BED',
): number {
  return (
    room.extraFlatPrice ??
    (type === 'WITH_BED' ? room.extraBedPrice : room.extraNoBedPrice) ??
    0
  );
}
