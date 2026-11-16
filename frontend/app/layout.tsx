import type { Metadata } from 'next';
import { Newsreader, Public_Sans } from 'next/font/google';
import { resolveContentImage, type SiteContent } from '@/lib/api/siteContent';
import { AuthProvider } from '@/lib/auth/AuthProvider';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import './globals.css';

// Heading — serif editorial. Dipakai di bobot ringan (400–600) supaya terbaca
// seperti halaman cetak, bukan judul tebal khas template.
const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

// Body — sans netral dengan tinggi-x lega, enak dibaca di layar kecil.
const publicSans = Public_Sans({
  variable: '--font-public-sans',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const SITE_NAME = "D'Glorious Crater Kamojang";

/**
 * Deskripsi meta dan foto OG dibaca dari CMS di server, dengan revalidate 60
 * detik: perubahan dari super admin sampai ke pratinjau WhatsApp/Instagram
 * dalam semenit tanpa deploy ulang, dan backend tidak dipukul tiap request.
 *
 * Metadata dirender di server, jadi tidak tahu bahasa pilihan pengunjung
 * (disimpan di localStorage klien); yang dipakai teks Indonesia.
 *
 * Kalau backend tidak terjangkau (mis. saat build), hasilnya jatuh ke
 * deskripsi netral berupa nama situs saja, bukan melempar galat yang
 * merobohkan halaman, dan bukan salinan bisnis yang ditulis ulang di sini.
 */
async function loadSiteMeta(): Promise<{
  description: string;
  image: string | null;
}> {
  try {
    const res = await fetch(`${API_URL}/site-content`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const content = (await res.json()) as SiteContent;
    const imageUrl = content.sections.home_hero.imageUrl;
    return {
      description: content.sections.site_meta.description.id || SITE_NAME,
      image: imageUrl ? resolveContentImage(imageUrl) : null,
    };
  } catch {
    return { description: SITE_NAME, image: null };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const { description, image } = await loadSiteMeta();
  // Tanpa foto dari CMS, tag gambar dihilangkan; pratinjau tanpa gambar lebih
  // jujur daripada gambar yang tidak sesuai.
  const images = image
    ? [{ url: image, width: 1200, height: 630, alt: SITE_NAME }]
    : undefined;

  return {
    // Gambar Open Graph harus berupa URL absolut. Tanpa basis ini Next memakai
    // http://localhost:3000, jadi kartu pratinjaunya kosong begitu dideploy.
    // Isi NEXT_PUBLIC_SITE_URL di environment produksi dengan domain aslinya.
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    ),
    title: {
      default: SITE_NAME,
      template: `%s · ${SITE_NAME}`,
    },
    description,
    // Situs ini dibagikan orang lewat WhatsApp dan Instagram jauh lebih sering
    // daripada ditemukan lewat pencarian — tanpa tag di bawah, tautannya muncul
    // sebagai teks polos tanpa gambar, dan nyaris tidak ada yang mengkliknya.
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      siteName: SITE_NAME,
      title: SITE_NAME,
      description,
      images,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: SITE_NAME,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // `data-scroll-behavior="smooth"` mengembalikan perilaku Next 15: dengan
    // `scroll-behavior: smooth` di CSS (dipakai anchor #atraksi/#fasilitas/
    // #tiket), Next 16 tidak lagi otomatis menonaktifkannya saat pindah rute —
    // tanpa atribut ini setiap perpindahan halaman ikut digulir pelan.
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${newsreader.variable} ${publicSans.variable}`}
    >
      <body>
        <I18nProvider>
          <AuthProvider>{children}</AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
