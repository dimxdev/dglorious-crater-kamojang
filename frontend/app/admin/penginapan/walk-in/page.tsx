import type { Metadata } from 'next';
import { WalkinBookingPage } from '@/components/admin/penginapan/WalkinBookingPage';

export const metadata: Metadata = { title: 'Tamu Langsung' };

export default function AdminWalkin() {
  return <WalkinBookingPage />;
}
