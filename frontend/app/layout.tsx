import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { I18nProvider } from '@/lib/i18n/I18nProvider';
import './globals.css';

// Heading — serif elegan sesuai desain.
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
});

// Body — sans modern & mudah dibaca.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
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
    <html lang="id" className={`${playfair.variable} ${inter.variable}`}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
