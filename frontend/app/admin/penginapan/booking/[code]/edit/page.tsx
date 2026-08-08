import type { Metadata } from 'next';
import { EditBookingPage } from '@/components/admin/penginapan/EditBookingPage';

export const metadata: Metadata = { title: 'Edit Booking' };

export default async function AdminEditBookingRoute({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <EditBookingPage code={code} />;
}
