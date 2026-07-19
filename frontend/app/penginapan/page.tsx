import type { Metadata } from 'next';
import { ListingPage } from '@/components/public/ListingPage';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = { title: 'Penginapan' };

export default function Penginapan() {
  return (
    <PublicLayout>
      <ListingPage />
    </PublicLayout>
  );
}
