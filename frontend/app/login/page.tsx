import type { Metadata } from 'next';
import { LoginPage } from '@/components/public/LoginPage';

export const metadata: Metadata = { title: 'Masuk' };

export default function Login() {
  return <LoginPage />;
}
