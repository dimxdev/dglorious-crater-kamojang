import type { Metadata } from 'next';
import { TermsPage } from '@/components/public/TermsPage';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = { title: 'Syarat & Ketentuan' };

export default function SyaratKetentuan() {
  return (
    <PublicLayout>
      <TermsPage />
    </PublicLayout>
  );
}
