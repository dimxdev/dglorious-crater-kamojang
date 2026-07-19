// Data admin (MOCK). TODO(FASE 8/9): ganti dengan API booking backend.
import { rooms } from './rooms';

export type BookingSource = 'ONLINE' | 'WALK_IN';

export type AdminBooking = {
  kode: string;
  guest: string;
  wa: string;
  room: string;
  checkIn: string; // ISO
  checkOut: string;
  source: BookingSource;
  total: number;
  status: string; // BookingStatus
};

export const adminBookings: AdminBooking[] = [
  { kode: 'DGC-48213', guest: 'Andini Rahmawati', wa: '0812-3456-7890', room: 'Glamping Deluxe', checkIn: '2026-07-20', checkOut: '2026-07-22', source: 'ONLINE', total: 1785000, status: 'CONFIRMED' },
  { kode: 'DGC-48210', guest: 'Budi Santoso', wa: '0813-2211-9080', room: 'Cottage Keluarga', checkIn: '2026-07-20', checkOut: '2026-07-23', source: 'ONLINE', total: 4725000, status: 'WAITING_PAYMENT' },
  { kode: 'DGC-48208', guest: 'Citra Lestari', wa: '0821-7788-1122', room: 'Tenda Standar', checkIn: '2026-07-18', checkOut: '2026-07-20', source: 'WALK_IN', total: 1050000, status: 'CHECKED_IN' },
  { kode: 'DGC-48201', guest: 'Dedi Kurniawan', wa: '0857-9900-3311', room: 'Glamping Deluxe', checkIn: '2026-07-15', checkOut: '2026-07-17', source: 'ONLINE', total: 1785000, status: 'COMPLETED' },
  { kode: 'DGC-48197', guest: 'Eka Putri', wa: '0812-5566-7788', room: 'Cottage Keluarga', checkIn: '2026-07-14', checkOut: '2026-07-16', source: 'ONLINE', total: 3150000, status: 'EXPIRED' },
  { kode: 'DGC-48190', guest: 'Fajar Nugroho', wa: '0838-1234-5566', room: 'Tenda Standar', checkIn: '2026-07-12', checkOut: '2026-07-14', source: 'WALK_IN', total: 1050000, status: 'COMPLETED' },
  { kode: 'DGC-48185', guest: 'Gita Savitri', wa: '0819-8877-6655', room: 'Glamping Deluxe', checkIn: '2026-07-21', checkOut: '2026-07-22', source: 'ONLINE', total: 892500, status: 'CONFIRMED' },
  { kode: 'DGC-48180', guest: 'Hendra Wijaya', wa: '0811-2233-4455', room: 'Cottage Keluarga', checkIn: '2026-07-10', checkOut: '2026-07-12', source: 'ONLINE', total: 3150000, status: 'CANCELLED' },
  { kode: 'DGC-48175', guest: 'Indah Permata', wa: '0852-6677-8899', room: 'Tenda Standar', checkIn: '2026-07-22', checkOut: '2026-07-24', source: 'WALK_IN', total: 1050000, status: 'CONFIRMED' },
];

export const recentBookings = adminBookings.slice(0, 5);

/** Ringkasan CMS penginapan (dari data rooms). */
export const cmsRooms = rooms.map((r) => ({
  slug: r.slug,
  name: r.name,
  price: r.pricePerNight,
  capacity: r.capacity,
  units: r.totalUnits,
  active: true,
  icon: r.coverIcon,
}));

/** Label & tone status booking (bilingual label diambil dari i18n di komponen). */
export const statusLabelId: Record<string, string> = {
  PENDING: 'Pending',
  WAITING_PAYMENT: 'Menunggu',
  PAID: 'Dibayar',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Check-in',
  COMPLETED: 'Selesai',
  EXPIRED: 'Expired',
  CANCELLED: 'Dibatalkan',
  REJECTED: 'Ditolak',
};
