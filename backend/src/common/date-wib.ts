/** Tanggal kalender hari ini di Asia/Jakarta (WIB, UTC+7) sebagai 'YYYY-MM-DD'.
 *  Jangan pakai toISOString() (UTC) — jam 00:00–07:00 WIB hasilnya kemarin. */
export function todayWib(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** True kalau tanggal (string 'YYYY-MM-DD' atau ISO) jatuh sebelum hari ini WIB. */
export function isBeforeTodayWib(
  dateStr: string,
  now: Date = new Date(),
): boolean {
  return dateStr.slice(0, 10) < todayWib(now);
}

/** True kalau tanggal (string 'YYYY-MM-DD' atau ISO) tepat hari ini WIB. */
export function isTodayWib(dateStr: string, now: Date = new Date()): boolean {
  return dateStr.slice(0, 10) === todayWib(now);
}
