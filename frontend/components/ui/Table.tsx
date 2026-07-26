import { cn } from '@/lib/cn';

/**
 * Bungkus tabel agar bisa scroll horizontal sendiri di layar sempit.
 *
 * ⚠️ Konsekuensi CSS (jangan diubah tanpa baca ini dulu): `overflow-x-auto`
 * di sini bikin browser otomatis menghitung `overflow-y` jadi `auto` juga
 * (aturan spec CSS Overflow, bukan bug) — artinya div ini SELALU jadi scroll
 * ancestor, walau tingginya auto/tidak dibatasi. Akibatnya <THead sticky>
 * TIDAK BISA nempel ke halaman dari sini (akan salah tempel — sudah pernah
 * kejadian). Kalau butuh sticky header, itu cuma bisa didapat dengan
 * mengorbankan scroll horizontal yang kekontain (lihat BookingsPage.tsx).
 */
export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="border-border w-full overflow-x-auto rounded-xl border bg-white">
      <table className={cn('w-full text-left text-sm', className)} {...props} />
    </div>
  );
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('bg-cream-100 text-muted text-xs uppercase', className)}
      {...props}
    />
  );
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-border divide-y', className)} {...props} />
  );
}

export function Tr({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn('hover:bg-cream-50 transition-colors', className)} {...props} />;
}

export function Th({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn('px-4 py-3 font-semibold', className)} {...props} />;
}

export function Td({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3', className)} {...props} />;
}
