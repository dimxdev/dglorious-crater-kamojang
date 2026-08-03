import type { Metadata } from 'next';
import { OverviewPage } from '@/components/admin/penginapan/OverviewPage';

export const metadata: Metadata = { title: 'Ringkasan Penginapan' };

export default function AdminOverview() {
  return <OverviewPage />;
}
