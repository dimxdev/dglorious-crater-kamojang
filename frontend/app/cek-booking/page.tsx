import type { Metadata } from 'next';
import { CekBookingPage } from '@/components/public/CekBookingPage';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = { title: 'Cek Booking' };

export default function CekBooking() {
  return (
    <PublicLayout>
      <CekBookingPage />
    </PublicLayout>
  );
}
