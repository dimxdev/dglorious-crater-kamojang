/** Format kanonik nomor WhatsApp Indonesia: +628xxxxxxxxx (E.164). */
export const PHONE_REGEX = /^\+628[0-9]{7,12}$/;
export const PHONE_MESSAGE =
  'Nomor WhatsApp tidak valid (contoh: 0812-3456-7890 atau +62 812-3456-7890).';

/**
 * Normalisasi input bebas (spasi, strip, titik, kurung; awalan 08…, 8…, 628…,
 * +628…) ke "+62…". Hasil belum tentu valid — cek dengan PHONE_REGEX.
 * Nilai non-string dikembalikan apa adanya.
 */
export function normalizeIdPhone<T>(value: T): T | string {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return trimmed;
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('62')) return `+${digits}`;
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `+62${digits}`;
  return digits;
}
