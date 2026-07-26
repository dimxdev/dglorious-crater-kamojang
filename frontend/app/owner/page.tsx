import type { Metadata } from 'next';
import { OwnerOverviewPage } from '@/components/owner/OwnerOverviewPage';

export const metadata: Metadata = { title: 'Dashboard Owner' };

export default function Owner() {
  return <OwnerOverviewPage />;
}
