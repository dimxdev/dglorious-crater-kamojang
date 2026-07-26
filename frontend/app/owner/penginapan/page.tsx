import type { Metadata } from 'next';
import { OwnerPenginapanPage } from '@/components/owner/OwnerPenginapanPage';

export const metadata: Metadata = { title: 'Penginapan — Owner' };

export default function OwnerPenginapan() {
  return <OwnerPenginapanPage />;
}
