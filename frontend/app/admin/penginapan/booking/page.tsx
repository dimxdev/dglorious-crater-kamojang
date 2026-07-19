import type { Metadata } from 'next';
import { BookingsPage } from '@/components/admin/BookingsPage';

export const metadata: Metadata = { title: 'Data Booking' };

export default function AdminBookings() {
  return <BookingsPage />;
}
