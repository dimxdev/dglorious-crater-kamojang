import type { Metadata } from 'next';
import { KelolaAkunPage } from '@/components/super-admin/akun/KelolaAkunPage';

export const metadata: Metadata = { title: 'Kelola Akun' };

export default function Page() {
  return <KelolaAkunPage />;
}
