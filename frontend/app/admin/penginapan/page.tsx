import type { Metadata } from 'next';
import { OverviewPage } from '@/components/admin/OverviewPage';

export const metadata: Metadata = { title: 'Ringkasan Penginapan' };

export default function AdminOverview() {
  return <OverviewPage />;
}
