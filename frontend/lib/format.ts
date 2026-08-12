/** Format angka ke Rupiah, mis. 850000 → "Rp850.000". */
export function formatIDR(value: number, opts?: { withDecimals?: boolean }) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: opts?.withDecimals ? 2 : 0,
    maximumFractionDigits: opts?.withDecimals ? 2 : 0,
  }).format(value);
}

/** Format tanggal ISO → "20 Jul 2026". */
export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

/** Format datetime ISO → "20 Jul 2026, 10:30". */
export function formatDateTime(date: string | Date) {
  const d = new Date(date);
  const datePart = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
  return `${datePart}, ${timePart}`;
}

/** Ambil inisial (maks 2 huruf) dari nama lengkap, mis. "Admin Penginapan" → "AP". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}
