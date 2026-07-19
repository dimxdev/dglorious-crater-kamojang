import type { Metadata } from 'next';
import { AboutPage } from '@/components/public/AboutPage';
import { PublicLayout } from '@/components/layout/PublicLayout';

export const metadata: Metadata = { title: 'Tentang' };

export default function Tentang() {
  return (
    <PublicLayout>
      <AboutPage />
    </PublicLayout>
  );
}
