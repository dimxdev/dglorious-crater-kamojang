import type { Metadata } from 'next';
import { ReservationsPage } from '@/components/admin/penginapan/ReservationsPage';

export const metadata: Metadata = { title: 'Data Reservasi' };

export default function AdminReservations() {
  return <ReservationsPage />;
}
