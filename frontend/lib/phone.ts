/** Nomor seluler Indonesia kanonik: "+628" + 7-12 digit. Sama dengan backend. */
export const PHONE_RE = /^\+628[0-9]{7,12}$/;

/**
 * Terima format umum (0812-3456-7890, 812…, 62812…, +62 812 …, pakai spasi,
 * strip, titik, kurung) dan kembalikan "+62…"; null kalau tidak valid.
 */
export function normalizeIdPhone(input: string): string | null {
  let s = input.trim();
  if (!/^\+?[0-9\s\-.()]+$/.test(s)) return null;
  const plus = s.startsWith('+');
  s = s.replace(/\D/g, '');
  if (plus && !s.startsWith('62')) return null;
  let out: string;
  if (s.startsWith('62')) out = `+${s}`;
  else if (s.startsWith('0')) out = `+62${s.slice(1)}`;
  else if (s.startsWith('8')) out = `+62${s}`;
  else return null;
  return PHONE_RE.test(out) ? out : null;
}

/** Kosong atau tidak valid = true (dipakai untuk menandai galat setelah ada isian). */
export function isInvalidPhone(input: string): boolean {
  return input.trim() !== '' && normalizeIdPhone(input) === null;
}

/** Digit saja untuk wa.me (tanpa "+" dan pemisah); nomor lokal "08…" diubah ke "628…". */
export function waDigits(raw: string): string {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('0')) return `62${d.slice(1)}`;
  return d;
}

/** "+6281234567890" -> "+62 812-3456-7890"; nilai di luar pola dikembalikan apa adanya. */
export function formatPhoneDisplay(raw: string | null | undefined): string {
  if (!raw) return '';
  const n = normalizeIdPhone(raw);
  if (!n) return raw;
  const rest = n.slice(3);
  return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
}
