'use client';

// Grafik ringan berbasis SVG (tanpa library). Data statis dari lib/data/owner.
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { formatIDR } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/I18nProvider';

type Segment = { label: string; value: number; count?: number; revenue?: number; color: string };

export function RevenueLineChart({ data }: { data: { m: string; v: number }[] }) {
  const W = 620,
    H = 210,
    pl = 8,
    pt = 18,
    pb = 26,
    iw = W - pl - 8,
    ih = H - pt - pb,
    // Skala dinamis dari data asli — nilai mock lama (140–340) sengaja
    // dihapus supaya angka pendapatan real (bisa jauh lebih kecil) tetap
    // kebaca, bukan mepet ke garis bawah/atas grafik.
    values = data.map((d) => d.v),
    max = Math.max(...values, 1) * 1.15,
    min = 0;

  const pts = data.map((d, i) => ({
    x: pl + (iw * i) / (data.length - 1),
    y: pt + ih - ((d.v - min) / (max - min)) * ih,
    m: d.m,
  }));
  const line = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area =
    `M${pts[0].x.toFixed(1)},${pt + ih} ` +
    pts.map((p) => `L${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') +
    ` L${pts[pts.length - 1].x.toFixed(1)},${pt + ih} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-57.5 w-full overflow-visible">
      <defs>
        <linearGradient id="revgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B4332" stopOpacity="0.22" />
          <stop offset="1" stopColor="#1B4332" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#revgrad)" />
      <polyline
        points={line}
        fill="none"
        stroke="#1B4332"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {pts.map((p) => (
        <g key={p.m}>
          <circle cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#C1663F" strokeWidth="2.5" />
          <text x={p.x} y="204" textAnchor="middle" fontSize="11" fill="#6B7A70">
            {p.m}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function UnitBarChart({
  bars,
}: {
  bars: { label: string; value: number; active: boolean }[];
}) {
  const max = Math.max(...bars.map((b) => b.value), 1) * 1.15;
  return (
    // overflow-x-auto + min-w-max: kalau bar terlalu banyak/label panjang buat
    // muat di layar mobile, yang scroll cuma kartu chart-nya, bukan seluruh halaman.
    <div className="mt-4 -mx-1 overflow-x-auto px-1">
      <div className="flex h-45 min-w-max items-end justify-around gap-3 sm:gap-2.5">
        {bars.map((b) => (
          <div key={b.label} className="flex h-full w-12 flex-col items-center justify-end sm:w-14">
            {b.active && (
              <div className="text-forest-700 mb-1.5 text-xs font-bold whitespace-nowrap">
                Rp{Math.round(b.value / 1000) || b.value}jt
              </div>
            )}
            <div
              className="w-10 rounded-t-lg sm:w-13"
              style={{
                height: b.active ? `${(b.value / max) * 150}px` : '4px',
                background: b.active ? '#1B4332' : '#e2ddd0',
              }}
            />
            <div className="text-muted mt-2 text-center text-[11px] leading-tight sm:text-xs">
              {b.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DonutChart({ segments }: { segments: Segment[] }) {
  const { t } = useTranslation();
  const [active, setActive] = useState<string | null>(null);
  const r = 54;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((a, s) => a + s.value, 0);
  let acc = 0;
  const arcs = segments.map((s) => {
    const len = (C * s.value) / total;
    const off = (-C * acc) / total;
    acc += s.value;
    return { ...s, len, off, pct: Math.round((s.value / total) * 100) };
  });

  const toggle = (label: string) => setActive((cur) => (cur === label ? null : label));

  return (
    <div>
      <div className="relative mx-auto mt-4 h-35 w-35">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
          {arcs.map((a) => (
            <circle
              key={a.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={a.color}
              strokeWidth={active === a.label ? 22 : 18}
              strokeOpacity={active && active !== a.label ? 0.35 : 1}
              strokeDasharray={`${a.len.toFixed(1)} ${(C - a.len).toFixed(1)}`}
              strokeDashoffset={a.off.toFixed(1)}
              className="cursor-pointer transition-all"
              onClick={() => toggle(a.label)}
            />
          ))}
        </svg>
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
              <b>{a.pct}%</b>
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
