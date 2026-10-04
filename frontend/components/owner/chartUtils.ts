/** Util bareng buat grafik SVG Owner (sparkline kartu + grafik tren besar). */

export type Pt = { x: number; y: number };

/**
 * Path melengkung halus lewat semua titik (Catmull-Rom → kurva Bezier).
 * Dipakai biar garis tren gak patah-patah kaku seperti polyline lurus, tapi
 * tetap melewati titik data aslinya (bukan aproksimasi yang menggeser nilai).
 */
export function smoothPath(pts: Pt[]): string {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x},${pts[0].y}`;

  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }
  return d;
}

/** Skala nilai → koordinat SVG, dengan headroom biar puncak gak nempel atap. */
export function scalePoints(
  values: number[],
  opts: { width: number; height: number; padTop?: number; padBottom?: number },
): Pt[] {
  const { width, height, padTop = 0, padBottom = 0 } = opts;
  const inner = height - padTop - padBottom;
  // Semua nilai 0 (mis. periode tanpa pendapatan) → garis rata di dasar,
  // bukan NaN karena dibagi nol.
  const max = Math.max(...values, 0) || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values.map((v, i) => ({
    x: values.length > 1 ? i * step : width / 2,
    y: padTop + inner - (v / max) * inner,
  }));
}

/** "Rp13,0 jt" / "Rp850 rb" — angka pendek buat sumbu & tooltip grafik. */
export function formatShortIDR(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  if (Math.abs(value) >= 1_000) return `Rp${Math.round(value / 1_000)} rb`;
  return `Rp${value}`;
}
