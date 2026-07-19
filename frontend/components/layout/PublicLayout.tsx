import { FloatingWhatsApp } from './FloatingWhatsApp';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

/** Layout halaman publik: navbar + konten + footer + tombol WhatsApp mengambang. */
export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
