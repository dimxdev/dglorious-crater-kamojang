import type { Metadata } from 'next';
import { CheckinPage } from '@/components/admin/CheckinPage';

export const metadata: Metadata = { title: 'Check-in' };

export default function AdminCheckin() {
  return <CheckinPage />;
}
