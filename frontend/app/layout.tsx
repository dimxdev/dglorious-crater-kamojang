import type { Metadata } from 'next';
import { Newsreader, Public_Sans } from 'next/font/google';
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

export const metadata: Metadata = {
  title: {
    default: "D'Glorious Crater Kamojang",
    template: "%s · D'Glorious Crater Kamojang",
  },
  description:
    'Wisata kawah geothermal, pemandian air panas, dan penginapan alam di perbatasan Bandung–Garut.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${newsreader.variable} ${publicSans.variable}`}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
