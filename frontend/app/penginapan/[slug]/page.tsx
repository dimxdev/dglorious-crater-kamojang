import type { Metadata } from 'next';
import { DetailPage } from '@/components/public/DetailPage';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { fetchPublicRoomTypeBySlug, resolveImageUrl } from '@/lib/api/roomTypes';

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

    // Halaman unit inilah yang paling sering dibagikan orang ke grup WhatsApp
    // saat merencanakan trip bareng — jadi kartu pratinjaunya perlu membawa
    // foto, kapasitas, dan harga, bukan cuma nama unitnya.
    // Tagline datang dari CMS dan tidak dijamin berakhiran tanda baca —
    // tanpa penutup ini kalimatnya menyambung jadi "…kolam air panas sendiri
    // Kapasitas 2 tamu."
    const tagline = room.tagline?.trim();
    const lead = tagline
      ? /[.!?]$/.test(tagline)
        ? tagline
        : `${tagline}.`
      : null;

    const desc = [
      lead,
      `Kapasitas ${room.capacity} tamu.`,
      `Mulai Rp${room.priceWeekday.toLocaleString('id-ID')} per malam.`,
    ]
      .filter(Boolean)
      .join(' ');

    const cover = room.images.find((i) => i.isCover) ?? room.images[0];

    return {
      title: room.name,
      description: desc,
      openGraph: {
        title: `${room.name} · D'Glorious Crater Kamojang`,
        description: desc,
        ...(cover
          ? { images: [{ url: resolveImageUrl(cover.url), alt: room.name }] }
          : {}),
      },
    };
  } catch {
    // Backend mati atau slug tidak ada — halamannya sendiri sudah menangani
    // keduanya, metadata cukup mundur ke judul generik daripada ikut gagal.
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
