import type { Locale } from '@/lib/i18n/config';

/**
 * Teks konten (bukan UI chrome) dalam beberapa bahasa. Meniru baris
 * `room_type_translations` di database (PROJECT.md §9): ID wajib, bahasa lain
 * opsional. Data mock mengisi ID + EN; nanti diganti respons API.
 */
export type LocalizedText = { id: string } & Partial<Record<Locale, string>>;

/** Ambil teks sesuai locale; fallback ke Indonesia jika kosong. */
export function pick(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.id;
}
