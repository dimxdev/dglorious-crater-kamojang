'use client';

import { BookingFormPage } from './BookingFormPage';

/**
 * Beda dari Booking WhatsApp: tamu sudah ada di lokasi saat dicatat, jadi
 * tidak ada jeda menunggu kedatangan — booking langsung CONFIRMED +
 * CHECKED_IN sekaligus (skip menu Check-in), dan pembayaran langsung Lunas
 * karena dibayar di tempat (bukan DP seperti alur WhatsApp).
 *
 * Isi formnya dipegang `BookingFormPage` bareng menu Booking WhatsApp.
 */
export function WalkinBookingPage() {
  return <BookingFormPage channel="WALK_IN" />;
}
