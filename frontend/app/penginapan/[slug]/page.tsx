import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DetailPage } from '@/components/public/DetailPage';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { getRoomSource, roomSources } from '@/lib/data/rooms';

export function generateStaticParams() {
  return roomSources.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomSource(slug);
  // Judul tab pakai nama Indonesia (metadata dirender di server, sebelum locale
  // klien diketahui); konten halaman menyesuaikan bahasa di klien.
  return { title: room?.name.id ?? 'Penginapan' };
}

export default async function RoomDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = getRoomSource(slug);
  if (!room) notFound();

  return (
    <PublicLayout>
      <DetailPage room={room} />
    </PublicLayout>
  );
}
