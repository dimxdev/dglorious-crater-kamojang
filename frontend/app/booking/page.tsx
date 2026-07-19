import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BookingForm } from '@/components/public/BookingForm';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = { title: 'Booking' };

export default function Booking() {
  return (
    <PublicLayout>
      <Suspense>
        <BookingForm />
      </Suspense>
    </PublicLayout>
  );
}
