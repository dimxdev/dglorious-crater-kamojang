import { BadRequestException } from '@nestjs/common';
import { ContentCollection } from '../generated/prisma/enums';

/**
 * Validator tulis-tangan untuk konten CMS (tanpa dependensi baru). Tiap
 * validator mengembalikan objek BERSIH (field tak dikenal dibuang) dan
 * melempar 400 berbahasa Indonesia dengan path field, mis. "benefits[1].id wajib diisi".
 */
type Validator<T = unknown> = (value: unknown, path: string) => T;

const MAX_TEXT = 5000;
const MAX_URL = 500;
const MAX_ICON = 40;

function fail(path: string, msg: string): never {
  throw new BadRequestException(`${path || 'content'} ${msg}`);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Teks dwibahasa: `id` wajib terisi, `en` boleh kosong (frontend fallback ke `id`). */
const L: Validator<{ id: string; en: string }> = (v, path) => {
  if (!isRecord(v)) fail(path, 'wajib diisi (teks dwibahasa ID/EN)');
  if (typeof v.id !== 'string' || v.id.trim() === '') {
    fail(`${path}.id`, 'wajib diisi');
  }
  if (v.id.trim().length > MAX_TEXT) {
    fail(`${path}.id`, `maksimal ${MAX_TEXT} karakter`);
  }
  if (typeof v.en !== 'string') fail(`${path}.en`, 'harus berupa teks');
  if (v.en.length > MAX_TEXT)
    fail(`${path}.en`, `maksimal ${MAX_TEXT} karakter`);
  return { id: v.id.trim(), en: v.en.trim() };
};

const str =
  (max: number, required = true): Validator<string> =>
  (v, path) => {
    if (typeof v !== 'string') fail(path, 'harus berupa teks');
    const t = v.trim();
    if (required && t === '') fail(path, 'wajib diisi');
    if (t.length > max) fail(path, `maksimal ${max} karakter`);
    return t;
  };

const url: Validator<string> = str(MAX_URL);
const icon: Validator<string> = str(MAX_ICON);

const int: Validator<number> = (v, path) => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0) {
    fail(path, 'harus berupa bilangan bulat >= 0');
  }
  return v;
};

const bool: Validator<boolean> = (v, path) => {
  if (typeof v !== 'boolean') fail(path, 'harus berupa true/false');
  return v;
};

const arrayOf =
  <T>(item: Validator<T>, min: number, max: number): Validator<T[]> =>
  (v, path) => {
    if (!Array.isArray(v)) fail(path, 'harus berupa daftar');
    if (v.length < min) fail(path, `minimal ${min} isi`);
    if (v.length > max) fail(path, `maksimal ${max} isi`);
    return v.map((x, i) => item(x, `${path}[${i}]`));
  };

type Shape = Record<string, Validator | { optional: Validator }>;

/** Objek dengan bentuk tetap; field `{ optional }` boleh absen. */
const obj =
  (shape: Shape): Validator<Record<string, unknown>> =>
  (v, path) => {
    if (!isRecord(v)) fail(path, 'harus berupa objek');
    const out: Record<string, unknown> = {};
    for (const [key, rule] of Object.entries(shape)) {
      const sub = path ? `${path}.${key}` : key;
      const optional = typeof rule !== 'function';
      const validator = typeof rule === 'function' ? rule : rule.optional;
      if (v[key] === undefined || v[key] === null) {
        if (optional) continue;
        fail(sub, 'wajib diisi');
      }
      out[key] = validator(v[key], sub);
    }
    return out;
  };

const opt = (validator: Validator) => ({ optional: validator });

const stat = obj({ label: L, value: L });

export const SECTION_SCHEMAS: Record<string, Validator> = {
  home_hero: obj({ title: L, subtitle: L, imageUrl: url }),
  home_attractions: obj({ title: L }),
  home_facilities_teaser: obj({ body: L }),
  home_lodging: obj({ title: L, subtitle: L }),
  home_info: obj({ title: L, imageUrl: url }),
  home_routes: obj({ title: L, lead: L, mapsUrl: url }),
  home_faq: obj({ title: L, lead: L }),
  home_cta: obj({ title: L, subtitle: L, imageUrl: url }),
  about_intro: obj({ title: L, lead: L, stats: arrayOf(stat, 0, 4) }),
  about_history: obj({ body: L, imageUrl: url }),
  about_attractions: obj({ title: L }),
  about_gallery: obj({ title: L }),
  about_tickets: obj({ title: L, note: L }),
  about_parking: obj({ title: L }),
  facilities: obj({ title: L, note: L, disclaimer: L }),
  listing: obj({ title: L, lead: L, helpTitle: L, helpBody: L }),
  room_detail: obj({
    childrenRule: L,
    universalFacilitiesNote: L,
    priceNote: L,
  }),
  terms: obj({ title: L, subtitle: L, questionTitle: L, questionBody: L }),
  contact: obj({
    address: L,
    mapsQuery: url,
    footerTagline: L,
    waMessages: obj({ general: L, booking: L, room: L, terms: L }),
  }),
  site_meta: obj({ description: L }),
};

export const SECTION_KEYS = Object.keys(SECTION_SCHEMAS);

export const COLLECTION_SCHEMAS: Record<ContentCollection, Validator> = {
  ATTRACTION: obj({ name: L, desc: L, icon, featured: bool }),
  INFO_CARD: obj({
    icon,
    title: L,
    line1: L,
    line2: L,
    linkLabel: opt(L),
    href: opt(url),
  }),
  ROUTE: obj({ from: L, duration: L, distance: L, note: L }),
  FAQ: obj({ q: L, a: L }),
  TICKET_PACKAGE: obj({
    name: L,
    note: opt(L),
    benefits: arrayOf(L, 1, 30),
    priceDay: int,
    priceNight: int,
  }),
  PARKING_FEE: obj({ vehicle: L, price: int }),
  GALLERY: obj({ label: L }),
  FACILITY_ZONE: obj({ icon, name: L, note: L, items: arrayOf(L, 0, 50) }),
};

/** Koleksi yang memakai kolom `imageUrl` di tabel. */
export const COLLECTIONS_WITH_IMAGE: ContentCollection[] = [
  'ATTRACTION',
  'GALLERY',
];

export function validateSection(key: string, content: unknown) {
  const schema = SECTION_SCHEMAS[key];
  if (!schema) fail(key, 'bukan section yang dikenal');
  return schema(content, '');
}

export function validateItemContent(
  collection: ContentCollection,
  content: unknown,
) {
  return COLLECTION_SCHEMAS[collection](content, '');
}

/** `imageUrl` item: path `/images/...`, `/uploads/...`, atau URL http(s). */
export function validateImageUrl(value: unknown): string | null {
  if (value === null || value === '') return null;
  const s = str(MAX_URL)(value, 'imageUrl');
  if (!/^(\/|https?:\/\/)/.test(s)) {
    fail('imageUrl', 'harus diawali "/" atau http(s)://');
  }
  return s;
}
