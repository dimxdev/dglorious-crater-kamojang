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
