import type { Metadata } from 'next';
import { BookingDetailPage } from '@/components/public/BookingDetailPage';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = { title: 'Status Booking' };

export default async function BookingDetail({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = await params;

  return (
    <PublicLayout>
      <BookingDetailPage kode={decodeURIComponent(kode)} />
    </PublicLayout>
  );
}
