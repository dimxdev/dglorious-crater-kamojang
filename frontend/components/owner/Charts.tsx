// Grafik ringan berbasis SVG (tanpa library). Data statis dari lib/data/owner.

type Segment = { label: string; value: number; color: string };

export function RevenueLineChart({ data }: { data: { m: string; v: number }[] }) {
  const W = 620,
    H = 210,
    pl = 8,
    pt = 18,
    pb = 26,
    iw = W - pl - 8,
    ih = H - pt - pb,
    max = 340,
    min = 140;

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
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 h-[230px] w-full overflow-visible">
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
  const max = 340;
  return (
    <div className="mt-4 flex h-[180px] items-end justify-around gap-2.5">
      {bars.map((b) => (
        <div key={b.label} className="flex h-full flex-1 flex-col items-center justify-end">
          {b.active && (
            <div className="text-forest-700 mb-1.5 text-xs font-bold">
              Rp{Math.round(b.value / 1000) || b.value}jt
            </div>
          )}
          <div
            className="w-13 rounded-t-lg"
            style={{
              height: b.active ? `${(b.value / max) * 150}px` : '4px',
              background: b.active ? '#1B4332' : '#e2ddd0',
            }}
          />
          <div className="text-muted mt-2 text-center text-xs">{b.label}</div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ segments }: { segments: Segment[] }) {
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
              strokeWidth="18"
              strokeDasharray={`${a.len.toFixed(1)} ${(C - a.len).toFixed(1)}`}
              strokeDashoffset={a.off.toFixed(1)}
            />
          ))}
        </svg>
      </div>
      <div className="mt-3.5 flex flex-col gap-[7px]">
        {arcs.map((a) => (
          <div key={a.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: a.color }} />
            <span className="text-muted-strong flex-1">{a.label}</span>
            <b>{a.pct}%</b>
          </div>
        ))}
      </div>
    </div>
  );
}
