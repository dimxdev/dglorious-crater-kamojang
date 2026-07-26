import type { Metadata } from 'next';
import { WalkinBookingPage } from '@/components/admin/WalkinBookingPage';

export const metadata: Metadata = { title: 'Tamu Langsung' };

export default function AdminWalkin() {
  return <WalkinBookingPage />;
}
