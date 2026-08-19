import type { Metadata } from 'next';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { NotFoundPage } from '@/components/public/NotFoundPage';

export const metadata: Metadata = { title: 'Halaman Tidak Ditemukan' };

export default function NotFound() {
  return (
    <PublicLayout>
      <NotFoundPage />
    </PublicLayout>
  );
}
