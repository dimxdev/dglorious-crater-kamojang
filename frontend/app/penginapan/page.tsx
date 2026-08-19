import type { Metadata } from 'next';
import { ListingPage } from '@/components/public/ListingPage';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
  title: 'Penginapan',
  description:
    'Enam tipe unit di ketinggian Kamojang — tenda, cottage, glamping, dan campervan. Kapasitas, fasilitas, tarif weekday dan weekend, semuanya terbuka.',
  openGraph: {
    title: 'Penginapan',
    description:
      'Enam tipe unit di ketinggian Kamojang — tenda, cottage, glamping, dan campervan. Kapasitas, fasilitas, tarif weekday dan weekend, semuanya terbuka.',
  },
};

export default function Penginapan() {
  return (
    <PublicLayout>
      <ListingPage />
    </PublicLayout>
  );
}
