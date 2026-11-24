/**
 * Validator & sanitizer sisi klien. Backend tetap gerbang sebenarnya; di sini
 * cuma mencegah input yang jelas salah sebelum request dikirim.
 * Semua fungsi pesan menerima `t` (i18n) supaya teks mengikuti bahasa aktif.
 */

export type TFn = (key: string, params?: Record<string, string | number>) => string;

export const LIMITS = {
  adults: { min: 1, max: 50 },
  children: { min: 0, max: 50 },
  extraBed: { min: 0, max: 5 },
  maxRupiah: 1_000_000_000,
  maxNights: 30,
  guestName: 100,
  notes: 500,
  editReason: { min: 3, max: 300 },
  roomCapacity: { min: 1, max: 50 },
  roomUnits: { min: 0, max: 100 },
  roomName: 100,
  roomCategory: 60,
  roomTagline: 160,
  roomDescription: 3000,
  accountName: 100,
  password: { min: 8, max: 72 },
  imageBytes: 5 * 1024 * 1024,
} as const;

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isEmail(v: string): boolean {
  const s = v.trim();
  return s.length <= 254 && EMAIL_RE.test(s);
}

/** Buang semua karakter selain 0-9. */
export function sanitizeDigits(v: string, maxLen = 12): string {
  return v.replace(/\D/g, '').slice(0, maxLen);
}

/** Teks bebas -> bilangan bulat rupiah (null kalau kosong), maksimal 1.000.000.000. */
export function parseRupiah(raw: string): number | null {
  const digits = sanitizeDigits(raw, 10);
  if (digits === '') return null;
  return Math.min(Number(digits), LIMITS.maxRupiah);
}

export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/** Teks tempelan dianggap aman hanya kalau seluruhnya digit (tolak "-5", "1e9", "1.5"). */
export function isDigitsOnly(v: string): boolean {
  return /^\d+$/.test(v.trim());
}

/** True kalau teks tempelan bukan bilangan bulat murni ("-5", "1e9", "1,5"); titik ribuan boleh. */
export function isBadNumericPaste(text: string): boolean {
  const s = text.trim();
  return !isDigitsOnly(s.replace(/\./g, '')) || /[.,]\d{1,2}$/.test(s);
}

/** Tautan yang boleh di CMS: https://, http://, mailto:, tel:, atau path "/...". */
export function isSafeHref(v: string): boolean {
  const s = v.trim();
  if (s === '') return false;
  if (/\s/.test(s)) return false;
  if (s.startsWith('//')) return false;
  if (s.startsWith('/')) return true;
  return /^(https?:\/\/[^\s/]+|mailto:[^\s]+|tel:[+0-9()\-.]+)/i.test(s);
}

export function isHttpsUrl(v: string): boolean {
  try {
    const u = new URL(v.trim());
    return u.protocol === 'https:' && u.hostname.includes('.');
  } catch {
    return false;
  }
}

/** Pesan galat untuk berkas gambar, atau null kalau lolos. */
export function validateImageFile(file: File, t: TFn): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return t('validation.imageType');
  }
  if (file.size > LIMITS.imageBytes) return t('validation.imageSize');
  return null;
}

/** Ambil teks galat dari apa pun yang dilempar (string, Error, array class-validator). */
export function errorMessage(e: unknown, fallback: string): string {
  if (typeof e === 'string' && e.trim()) return e;
  if (e && typeof e === 'object') {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m.trim()) return m;
    if (Array.isArray(m)) {
      const joined = m.filter((x) => typeof x === 'string').join('; ');
      if (joined) return joined;
    }
  }
  return fallback;
}

// ── Reservasi ──────────────────────────────────────────────────────────

export type GroupForValidation = {
  slug: string;
  adults: number;
  children: number;
  extraBedQty: number;
};

export type RoomForValidation = { slug: string; name: string; capacity: number };

/** Pesan kapasitas per grup (indeks sama dengan `groups`), null kalau aman. */
export function capacityErrors(
  groups: GroupForValidation[],
  rooms: RoomForValidation[],
  t: TFn,
): (string | null)[] {
  return groups.map((g) => {
    const room = rooms.find((r) => r.slug === g.slug);
    if (!room) return null;
    const max = room.capacity + g.extraBedQty;
    if (g.adults > max) {
      return t('validation.overCapacity', { room: room.name, capacity: room.capacity });
    }
    if (g.children > max) {
      return t('validation.tooManyChildren', { room: room.name, max });
    }
    return null;
  });
}

/** Selisih malam dari dua string YYYY-MM-DD, 0 kalau tidak valid. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = Date.parse(`${checkIn}T00:00:00Z`);
  const b = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return 0;
  return Math.round((b - a) / 86400000);
}

/** Galat rentang tanggal: check-out harus setelah check-in, maks 30 malam. */
export function stayRangeError(checkIn: string, checkOut: string, t: TFn): string | null {
  if (!checkIn || !checkOut) return null;
  const n = nightsBetween(checkIn, checkOut);
  if (n <= 0) return t('validation.checkOutAfterCheckIn');
  if (n > LIMITS.maxNights) return t('validation.maxNights');
  return null;
}

export function guestNameError(name: string, t: TFn): string | null {
  const s = name.trim();
  if (!s) return t('validation.nameRequired');
  if (s.length > LIMITS.guestName) return t('validation.nameTooLong', { max: LIMITS.guestName });
  return null;
}

export function notesError(notes: string, t: TFn): string | null {
  if (notes.trim().length > LIMITS.notes) return t('validation.notesTooLong', { max: LIMITS.notes });
  return null;
}

export function editReasonError(reason: string, t: TFn): string | null {
  const n = reason.trim().length;
  if (n < LIMITS.editReason.min) return t('validation.reasonMin', { min: LIMITS.editReason.min });
  if (n > LIMITS.editReason.max) return t('validation.reasonMax', { max: LIMITS.editReason.max });
  return null;
}

export type PasswordChecks = { length: boolean; letter: boolean; digit: boolean };

export function passwordChecks(pw: string): PasswordChecks {
  return {
    length: pw.length >= LIMITS.password.min && pw.length <= LIMITS.password.max,
    letter: /\p{L}/u.test(pw),
    digit: /\d/.test(pw),
  };
}

/** Kata sandi baru: 8-72 karakter, ada huruf dan angka, tidak sama dengan email. */
export function passwordError(pw: string, t: TFn, email?: string): string | null {
  if (pw.length < LIMITS.password.min) return t('validation.passwordMin', { min: LIMITS.password.min });
  if (pw.length > LIMITS.password.max) return t('validation.passwordMax', { max: LIMITS.password.max });
  const c = passwordChecks(pw);
  if (!c.letter || !c.digit) return t('validation.passwordLetterDigit');
  if (email && pw.toLowerCase() === email.trim().toLowerCase()) return t('validation.passwordSameEmail');
  return null;
}

export function confirmError(pw: string, confirm: string, t: TFn): string | null {
  return pw === confirm ? null : t('validation.passwordMismatch');
}

/** Nama akun: 2-100 karakter, huruf/spasi/titik/apostrof/strip. */
export function accountNameError(name: string, t: TFn): string | null {
  const s = name.trim();
  if (!s) return t('superAdmin.accounts.nameRequired');
  if (s.length < 2) return t('validation.nameMin');
  if (s.length > LIMITS.accountName) return t('validation.nameTooLong', { max: LIMITS.accountName });
  if (!/^[\p{L} .'’-]+$/u.test(s) || !/\p{L}/u.test(s)) return t('validation.accountNameChars');
  return null;
}

export function emailError(email: string, t: TFn): string | null {
  if (!email.trim()) return t('validation.emailRequired');
  if (!isEmail(email)) return t('validation.emailInvalid');
  return null;
}

export function linkError(v: string, t: TFn): string | null {
  if (v.trim() === '') return null;
  return isSafeHref(v) ? null : t('validation.linkInvalid');
}

// ── Konten CMS ─────────────────────────────────────────────────────────

export const CMS_MAX_TEXT = 5000;
const LINK_KEYS = new Set(['href', 'mapsUrl']);

/**
 * Telusuri isi section/item CMS: tautan (href, mapsUrl) harus aman, dan teks
 * dwibahasa {id,en} wajib punya `id` yang tidak kosong/hanya spasi. Mengembalikan
 * pesan galat pertama, atau null.
 */
export function contentErrors(value: unknown, t: TFn): string | null {
  if (Array.isArray(value)) {
    for (const v of value) {
      const e = contentErrors(v, t);
      if (e) return e;
    }
    return null;
  }
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  if (typeof rec.id === 'string' && typeof rec.en === 'string') {
    if (rec.id.trim() === '') return t('validation.cmsIdRequired');
    if (rec.id.length > CMS_MAX_TEXT || rec.en.length > CMS_MAX_TEXT) {
      return t('validation.cmsTextTooLong', { max: CMS_MAX_TEXT });
    }
    return null;
  }
  for (const [k, v] of Object.entries(rec)) {
    if (LINK_KEYS.has(k) && typeof v === 'string') {
      if (v.trim() === '' || !isSafeHref(v)) return t('validation.linkInvalid');
      continue;
    }
    const e = contentErrors(v, t);
    if (e) return e;
  }
  return null;
}
