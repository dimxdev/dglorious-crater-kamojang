'use client';

import { BookingFormPage } from './BookingFormPage';

/**
 * Sesuai form reservasi WhatsApp resmi klien: nego, DP, & pelunasan terjadi
 * di WhatsApp (di luar sistem). Admin cuma mencatat begitu sudah "clear" —
 * booking sudah pasti tapi tamunya belum tiba (masih perlu Check-in nanti).
 *
 * Isi formnya dipegang `BookingFormPage` bareng menu Walk-in — bedanya cuma
 * di blok pembayaran & status awal, lihat komentar di sana.
 */
export function BookingWhatsappPage() {
  return <BookingFormPage channel="WHATSAPP" />;
}
