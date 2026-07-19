import type { Metadata } from 'next';
import { OwnerDashboard } from '@/components/owner/OwnerDashboard';

export const metadata: Metadata = { title: 'Dashboard Owner' };

export default function Owner() {
  return <OwnerDashboard />;
}
