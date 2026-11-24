import type { Metadata } from 'next';
import { EditReservationPage } from '@/components/admin/penginapan/EditReservationPage';

export const metadata: Metadata = { title: 'Edit Reservasi' };

export default async function AdminEditReservationRoute({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <EditReservationPage code={code} />;
}
