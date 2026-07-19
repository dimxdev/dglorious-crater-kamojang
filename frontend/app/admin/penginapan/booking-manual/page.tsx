import type { Metadata } from 'next';
import { ManualBookingPage } from '@/components/admin/ManualBookingPage';

export const metadata: Metadata = { title: 'Booking Manual' };

export default function AdminManualBooking() {
  return <ManualBookingPage />;
}
