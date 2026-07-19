import type { Metadata } from 'next';
import { KelolaPage } from '@/components/admin/KelolaPage';

export const metadata: Metadata = { title: 'Kelola Penginapan' };

export default function AdminKelola() {
  return <KelolaPage />;
}
