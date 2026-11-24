import { registerDecorator, ValidationOptions } from 'class-validator';

export const MAX_STAY_NIGHTS = 30;
export const MAX_MONEY = 1_000_000_000;

export const INVALID_DATE_MESSAGE = 'Tanggal tidak valid.';
export const CHECKOUT_AFTER_CHECKIN_MESSAGE =
  'Tanggal check-out harus setelah tanggal check-in.';
export const MAX_NIGHTS_MESSAGE = `Lama menginap maksimal ${MAX_STAY_NIGHTS} malam.`;
export const MONEY_INT_MESSAGE = 'Nominal harus bilangan bulat rupiah.';
export const MONEY_MAX_MESSAGE = 'Nominal terlalu besar.';

/** True hanya untuk tanggal kalender nyata 'YYYY-MM-DD' (bagian waktu boleh ada).
 *  `2027-02-30` ditolak: Date.parse menggulung ke Maret, jadi dibandingkan balik. */
export function isRealDate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ].*)?$/.exec(value);
  if (!m) return false;
  const date = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  if (date.toISOString().slice(0, 10) !== value.slice(0, 10)) return false;
  return !Number.isNaN(Date.parse(value));
}

/** Pesan error validasi rentang menginap, atau null kalau valid. */
export function validateStayDates(
  checkIn: string,
  checkOut: string,
): string | null {
  if (!isRealDate(checkIn) || !isRealDate(checkOut)) return INVALID_DATE_MESSAGE;
  const nights = Math.round(
    (Date.parse(`${checkOut.slice(0, 10)}T00:00:00Z`) -
      Date.parse(`${checkIn.slice(0, 10)}T00:00:00Z`)) /
      86400000,
  );
  if (nights <= 0) return CHECKOUT_AFTER_CHECKIN_MESSAGE;
  if (nights > MAX_STAY_NIGHTS) return MAX_NIGHTS_MESSAGE;
  return null;
}

/** Pesan error kapasitas dewasa per unit (extra bed menambah 1 dewasa), atau null. */
export function validateAdultCapacity(
  adults: number,
  capacity: number,
  extraBedQty: number,
  roomTypeName: string,
): string | null {
  if (adults <= capacity + extraBedQty) return null;
  return `Jumlah tamu dewasa melebihi kapasitas ${roomTypeName} (${capacity} orang). Tambahkan extra bed atau unit.`;
}

/** Anak (usia < 5 th tidak dihitung, S&K poin 8) dibatasi maksimal kapasitas + extra bed per unit. */
export function validateChildrenCapacity(
  children: number,
  capacity: number,
  extraBedQty: number,
  roomTypeName: string,
): string | null {
  const max = capacity + extraBedQty;
  if (children <= max) return null;
  return `Jumlah anak maksimal ${max} untuk ${roomTypeName}. Anak usia 6 tahun ke atas dihitung sebagai dewasa.`;
}

/** Pesan error diskon melebihi total kotor, atau null. */
export function validateDiscount(gross: number, discount: number): string | null {
  return discount > gross ? 'Diskon tidak boleh melebihi total harga.' : null;
}

/** Pesan error DP melebihi total akhir (sama dengan total diperbolehkan), atau null. */
export function validateDownPayment(total: number, paid: number): string | null {
  return paid > total ? 'Nominal DP tidak boleh melebihi total reservasi.' : null;
}

export function trimString({ value }: { value: unknown }): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export function IsRealDate(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isRealDate',
      target: object.constructor,
      propertyName,
      options: { message: INVALID_DATE_MESSAGE, ...options },
      validator: { validate: (value: unknown) => isRealDate(value) },
    });
  };
}
