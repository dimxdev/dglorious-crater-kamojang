'use client';

import { ReservationFormPage } from './ReservationFormPage';

/**
 * Beda dari Reservasi: tamu sudah ada di lokasi dan menginap mulai hari ini,
 * jadi tidak ada jeda menunggu kedatangan. Reservasi langsung CONFIRMED +
 * CHECKED_IN sekaligus (skip menu Check-in), dan pembayaran langsung Lunas
 * karena dibayar di tempat (bukan DP).
 *
 * Isi formnya dipegang `ReservationFormPage` bareng menu Catat Reservasi.
 */
export function TamuLangsungPage() {
  return <ReservationFormPage channel="LANGSUNG" />;
}
