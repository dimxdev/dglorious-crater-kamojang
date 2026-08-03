import type { Metadata } from 'next';
import { DetailPage } from '@/components/public/DetailPage';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { fetchPublicRoomTypeBySlug } from '@/lib/api/roomTypes';

// Katalog sekarang dinamis dari API (FASE 6), gak bisa dienumerasi saat build
// lagi seperti mock — jadi `generateStaticParams` sengaja dihapus, halaman
// ini render on-demand per slug.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  // Judul tab selalu versi ID (metadata dirender di server, sebelum locale
  // klien diketahui) — konten halaman menyesuaikan bahasa di klien.
  try {
    const room = await fetchPublicRoomTypeBySlug(slug, 'id');
    return { title: room.name };
  } catch {
    return { title: 'Penginapan' };
  }
}

export default async function RoomDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <PublicLayout>
      <DetailPage slug={slug} />
    </PublicLayout>
  );
}
