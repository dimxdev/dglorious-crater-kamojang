import type { Metadata } from 'next';
import { AboutPage } from '@/components/public/AboutPage';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
  title: 'Tentang',
  description:
    'Sejarah kawah panas bumi Kamojang, daya tarik wisatanya, fasilitas umum, serta harga tiket masuk dan tarif parkir.',
  openGraph: {
    title: 'Tentang',
    description:
      'Sejarah kawah panas bumi Kamojang, daya tarik wisatanya, fasilitas umum, serta harga tiket masuk dan tarif parkir.',
  },
};

export default function Tentang() {
  return (
    <PublicLayout>
      <AboutPage />
    </PublicLayout>
  );
}
