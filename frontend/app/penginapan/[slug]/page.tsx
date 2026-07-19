import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DetailPage } from '@/components/public/DetailPage';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { getRoomBySlug, rooms } from '@/lib/data/rooms';

export function generateStaticParams() {
  return rooms.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const room = getRoomBySlug(slug);
  return { title: room?.name ?? 'Penginapan' };
}

export default async function RoomDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const room = getRoomBySlug(slug);
  if (!room) notFound();

  return (
    <PublicLayout>
      <DetailPage room={room} />
    </PublicLayout>
  );
}
