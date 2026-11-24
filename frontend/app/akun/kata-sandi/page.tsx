import type { Metadata } from 'next';
import { GantiKataSandiPage } from '@/components/account/GantiKataSandiPage';

export const metadata: Metadata = { title: 'Ganti Kata Sandi' };

export default function Page() {
  return <GantiKataSandiPage />;
}
