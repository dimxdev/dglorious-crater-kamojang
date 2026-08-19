import type { Metadata } from 'next';
import { Newsreader, Public_Sans } from 'next/font/google';
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

const SITE_DESC =
  'Kawah panas bumi, pemandian air panas alami, dan glamping di ketinggian berkabut perbatasan Bandung–Garut. Reservasi lewat WhatsApp.';

export const metadata: Metadata = {
  // Gambar Open Graph harus berupa URL absolut. Tanpa basis ini Next memakai
  // http://localhost:3000, jadi kartu pratinjaunya kosong begitu dideploy.
  // Isi NEXT_PUBLIC_SITE_URL di environment produksi dengan domain aslinya.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ),
  title: {
    default: "D'Glorious Crater Kamojang",
    template: "%s · D'Glorious Crater Kamojang",
  },
  description: SITE_DESC,
  // Situs ini dibagikan orang lewat WhatsApp dan Instagram jauh lebih sering
  // daripada ditemukan lewat pencarian — tanpa tag di bawah, tautannya muncul
  // sebagai teks polos tanpa gambar, dan nyaris tidak ada yang mengkliknya.
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: "D'Glorious Crater Kamojang",
    title: "D'Glorious Crater Kamojang",
    description: SITE_DESC,
    images: [
      {
        url: '/images/home/hero-crater.jpg',
        width: 1200,
        height: 630,
        alt: 'Kawah vulkanik berselimut uap di lereng berumput hijau, Kamojang.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "D'Glorious Crater Kamojang",
    description: SITE_DESC,
    images: ['/images/home/hero-crater.jpg'],
  },
};

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
