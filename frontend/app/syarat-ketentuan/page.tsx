import type { Metadata } from 'next';
import { TermsPage } from '@/components/public/TermsPage';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan',
  description:
    'Dua belas poin syarat reservasi: uang muka, pembatalan, pindah tanggal, aturan kapasitas dan anak, serta jam check-in dan check-out.',
  openGraph: {
    title: 'Syarat & Ketentuan',
    description:
      'Dua belas poin syarat reservasi: uang muka, pembatalan, pindah tanggal, aturan kapasitas dan anak, serta jam check-in dan check-out.',
  },
};

export default function SyaratKetentuan() {
  return (
    <PublicLayout>
      <TermsPage />
    </PublicLayout>
  );
}
