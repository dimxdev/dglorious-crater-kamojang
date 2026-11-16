/** Tanggal kalender hari ini di Asia/Jakarta (WIB) sebagai 'YYYY-MM-DD'.
 *  Jangan pakai toISOString() (UTC) — jam 00:00–07:00 WIB hasilnya kemarin. */
export function todayWib(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Geser string 'YYYY-MM-DD' sebanyak `days` hari. Dihitung murni di UTC
 *  supaya tidak terpengaruh zona waktu browser. */
export function addDaysStr(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
