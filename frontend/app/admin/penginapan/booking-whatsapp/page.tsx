import type { Metadata } from 'next';
import { BookingWhatsappPage } from '@/components/admin/penginapan/BookingWhatsappPage';

export const metadata: Metadata = { title: 'Booking WhatsApp' };

export default function AdminBookingWhatsapp() {
  return <BookingWhatsappPage />;
}
