'use client';

// Grafik ringan berbasis SVG (tanpa library charting) — cukup buat kebutuhan
// dashboard ini dan bebas dari ~50KB+ bundle vendor.
import { useId, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';
import { formatShortIDR, smoothPath } from './chartUtils';

type Segment = { label: string; value: number; count?: number; revenue?: number; color: string };

/**
 * Batas atas sumbu yang "bulat" (1/2/5 × 10ⁿ) — biar label sumbu jadi angka
 * enak dibaca (0 · 5jt · 10jt · 15jt), bukan hasil bagi acak dari nilai maks.
 */
function niceMax(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

/**
 * Tren pendapatan 6 periode. `data[].v` dalam RUPIAH penuh (bukan "juta")
 * supaya nominal kecil gak hilang kena pembulatan — pemendekannya dilakukan
 * di sini saat render label.
 */
export function RevenueLineChart({ data }: { data: { m: string; v: number }[] }) {
  const { t } = useTranslation();
  const [active, setActive] = useState<number | null>(null);
  const gradId = useId();
  const clipId = useId();

  const W = 620;
  const H = 236;
  const pl = 56; // ruang label sumbu Y
  const pr = 10;
  const pt = 18;
  const pb = 30;
  const iw = W - pl - pr;
  const ih = H - pt - pb;

  const max = niceMax(Math.max(...data.map((d) => d.v), 0) * 1.1);
  const step = data.length > 1 ? iw / (data.length - 1) : 0;

  const pts = data.map((d, i) => ({
    ...d,
    x: data.length > 1 ? pl + step * i : pl + iw / 2,
    y: pt + ih - (d.v / max) * ih,
  }));

  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1]?.x.toFixed(2)},${pt + ih} L${pts[0]?.x.toFixed(2)},${pt + ih} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const last = pts.length - 1;
  const shown = active ?? null;

  function pick(clientX: number, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const vx = ((clientX - rect.left) / rect.width) * W;
    const idx = step > 0 ? Math.round((vx - pl) / step) : 0;
    setActive(Math.max(0, Math.min(data.length - 1, idx)));
  }

  return (
    <div
      className="relative mt-3 touch-pan-y"
      onPointerMove={(e) => pick(e.clientX, e.currentTarget)}
      onPointerDown={(e) => pick(e.clientX, e.currentTarget)}
      onPointerLeave={() => setActive(null)}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="h-57.5 w-full overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1B4332" stopOpacity="0.24" />
            <stop offset="1" stopColor="#1B4332" stopOpacity="0" />
          </linearGradient>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={W} height={H} data-chart-wipe />
          </clipPath>
        </defs>

        {/* Garis bantu + label sumbu Y */}
        {ticks.map((f) => {
          const y = pt + ih - f * ih;
          return (
            <g key={f}>
              <line
                x1={pl}
                y1={y}
                x2={W - pr}
                y2={y}
                stroke="#ece6d8"
                strokeWidth="1"
                strokeDasharray={f === 0 ? undefined : '3 4'}
              />
              <text
                x={pl - 10}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10.5"
                fill="#a09a8c"
                className="tabular-nums"
              >
                {f === 0 ? '0' : formatShortIDR(max * f)}
              </text>
            </g>
          );
        })}

        <g clipPath={`url(#${clipId})`}>
          <path d={area} fill={`url(#${gradId})`} />
          <path
            d={line}
            fill="none"
            stroke="#1B4332"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Garis pemandu vertikal saat kursor/jari menyusuri grafik */}
        {shown !== null && (
          <line
            x1={pts[shown].x}
            y1={pt}
            x2={pts[shown].x}
            y2={pt + ih}
            stroke="#C1663F"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        )}

        {pts.map((p, i) => (
          <g key={`${p.m}-${i}`}>
            {/* Denyut halus khusus periode terakhir — penanda "posisi sekarang" */}
            {i === last && shown === null && (
              <circle cx={p.x} cy={p.y} r="5" fill="#C1663F" data-chart-pulse />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={shown === i ? 6 : 4}
              fill="#fff"
              stroke="#C1663F"
              strokeWidth={shown === i ? 3 : 2.5}
              className="transition-all"
            />
            <text
              x={p.x}
              y={H - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight={shown === i ? 700 : 400}
              fill={shown === i ? '#1B4332' : '#6B7A70'}
            >
              {p.m}
            </text>
          </g>
        ))}
      </svg>

      {/* Tooltip sebagai HTML (bukan <text> SVG) — teksnya lebih tajam & gampang distyle */}
      {shown !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[125%] rounded-xl bg-[#1a1410] px-3 py-2 text-white shadow-lg"
          style={{ left: `${(pts[shown].x / W) * 100}%`, top: `${(pts[shown].y / H) * 100}%` }}
        >
          <div className="text-[10px] tracking-[0.1em] text-[#D4A04A] uppercase">
            {pts[shown].m}
          </div>
          <div className="mt-0.5 text-[13px] font-bold tabular-nums whitespace-nowrap">
            {formatIDR(pts[shown].v)}
          </div>
        </div>
      )}

      {data.every((d) => d.v === 0) && (
        <div className="text-muted absolute inset-0 flex items-center justify-center text-[12.5px]">
          {t('owner.chartNoData')}
        </div>
      )}
    </div>
  );
}

export function DonutChart({
  segments,
  centerLabel,
  centerUnit = 'idr',
}: {
  segments: Segment[];
  /** Teks kecil di tengah donat (mis. "Total") — nilainya dijumlah otomatis. */
  centerLabel?: string;
  /**
   * Satuan `value` tiap segmen. Wajib diisi 'count' kalau donatnya menghitung
   * jumlah booking, bukan rupiah — kalau tidak, totalnya kerender jadi "Rp5".
   */
  centerUnit?: 'idr' | 'count';
}) {
  const { t } = useTranslation();
  const [active, setActive] = useState<string | null>(null);
  const r = 54;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  const arcs = segments.map((s, i) => {
    // Offset tiap arc = akumulasi nilai segmen sebelumnya. Dihitung ulang per
    // item (bukan variabel `let` yang dimutasi saat map) supaya render tetap
    // murni — segmennya cuma 2–6 buah, jadi biaya O(n²)-nya gak terasa.
    const before = segments.slice(0, i).reduce((sum, x) => sum + x.value, 0);
    const len = total > 0 ? (C * s.value) / total : 0;
    const off = total > 0 ? (-C * before) / total : 0;
    return { ...s, len, off, pct: total > 0 ? Math.round((s.value / total) * 100) : 0 };
  });

  const toggle = (label: string) => setActive((cur) => (cur === label ? null : label));
  const activeArc = arcs.find((a) => a.label === active);

  return (
    <div>
      <div className="relative mx-auto mt-4 h-35 w-35">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          {/* Cincin dasar — biar donat tetap berbentuk walau semua nilainya 0 */}
          <circle cx="70" cy="70" r={r} fill="none" stroke="#f0ebe0" strokeWidth="18" />
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={active === a.label ? 22 : 18}
              strokeOpacity={active && active !== a.label ? 0.3 : 1}
              strokeDasharray={`${a.len.toFixed(1)} ${(C - a.len).toFixed(1)}`}
              strokeDashoffset={a.off.toFixed(1)}
              className="cursor-pointer transition-all"
              onClick={() => toggle(a.label)}
            />
          ))}
        </svg>

        {/* Isi tengah donat: ikut segmen yang lagi dipilih, kalau tidak ya total */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          {activeArc ? (
            <>
              <div className="font-serif text-[20px] leading-none font-extrabold text-forest-700 tabular-nums">
                {activeArc.pct}%
              </div>
              <div className="text-muted mt-1 max-w-22 truncate text-[10.5px]">
                {activeArc.label}
              </div>
            </>
          ) : (
            centerLabel && (
              <>
                <div className="text-muted text-[9.5px] tracking-[0.12em] uppercase">
                  {centerLabel}
                </div>
                <div className="text-forest-700 mt-0.5 font-serif text-[15px] leading-tight font-extrabold tabular-nums">
                  {centerUnit === 'count' ? total : formatShortIDR(total)}
                </div>
              </>
            )
          )}
        </div>
      </div>

      <div className="mt-3.5 flex flex-col gap-1.75">
        {arcs.map((a) => (
          <div key={a.label}>
            <button
              type="button"
              onClick={() => toggle(a.label)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left text-[12.5px] transition-colors',
                active === a.label ? 'bg-[#f4f1ea]' : 'hover:bg-[#f4f1ea]/60',
              )}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: a.color }} />
              <span className="text-muted-strong flex-1">{a.label}</span>
              <b className="tabular-nums">{a.pct}%</b>
            </button>
            {active === a.label && (
              <div className="text-muted flex items-center justify-between px-1.5 pb-1.5 text-[11.5px]">
                {typeof a.count === 'number' && (
                  <span>{t('owner.donutDetailBookings', { count: a.count })}</span>
                )}
                {typeof a.revenue === 'number' && (
                  <span className="text-forest-700 font-semibold">{formatIDR(a.revenue)}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
