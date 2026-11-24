import type { Metadata } from 'next';
import { TamuLangsungPage } from '@/components/admin/penginapan/TamuLangsungPage';

export const metadata: Metadata = { title: 'Tamu Langsung' };

export default function AdminTamuLangsung() {
  return <TamuLangsungPage />;
}
