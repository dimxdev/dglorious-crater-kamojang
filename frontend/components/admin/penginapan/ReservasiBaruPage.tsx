'use client';

import { ReservationFormPage } from './ReservationFormPage';

/**
 * Reservasi (§6.1): tamu menginap mulai hari ini atau tanggal mendatang.
 * Nego, DP, dan pelunasan terjadi di WhatsApp atau saat tamu datang memesan,
 * admin cuma mencatat setelah sepakat. Status awal DP atau Lunas, check-in
 * dilakukan nanti saat tamu tiba lewat menu Data Reservasi.
 *
 * Isi formnya dipegang `ReservationFormPage` bareng menu Tamu Langsung.
 */
export function ReservasiBaruPage() {
  return <ReservationFormPage channel="RESERVASI" />;
}
