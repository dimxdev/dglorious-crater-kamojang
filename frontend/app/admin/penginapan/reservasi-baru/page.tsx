import type { Metadata } from 'next';
import { ReservasiBaruPage } from '@/components/admin/penginapan/ReservasiBaruPage';

export const metadata: Metadata = { title: 'Catat Reservasi' };

export default function AdminReservasiBaru() {
  return <ReservasiBaruPage />;
}
