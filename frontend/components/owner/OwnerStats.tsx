'use client';

import {
  CalendarCheck,
  Crown,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/cn';
import type { StatUnit } from '@/lib/data/owner';
import { formatIDR } from '@/lib/format';
import { useCountUp } from '@/lib/useCountUp';
import { scalePoints, smoothPath } from './chartUtils';

/**
 * Format nilai stat sesuai satuannya — dipakai ulang tiap frame animasi
 * hitung-naik.
 *
 * NBSP bawaan `formatIDR` (antara "Rp" dan angkanya) diganti spasi biasa:
 * dengan NBSP teksnya gak pernah mau pecah baris, jadi kalau nominalnya
 * kepanjangan buat kartunya dia menembus keluar kotak. Dengan spasi biasa,
 * kasus ekstrem (miliaran di kartu sempit) turun rapi ke baris kedua — di
 * nominal normal tetap satu baris, jadi tampilannya gak berubah.
 */
function formatStat(value: number, unit: StatUnit): string {
  if (unit === 'idr') return formatIDR(Math.round(value)).replace(/ /g, ' ');
  if (unit === 'pct') return `${Math.round(value)}%`;
  return String(Math.round(value));
}

/** Garis tren mini tanpa sumbu — konteks arah, bukan buat dibaca angkanya. */
function Sparkline({
  values,
  stroke,
  fill,
  className,
}: {
  values: number[];
  stroke: string;
  fill?: string;
  className?: string;
}) {
  const gradientId = useId();
  const W = 120;
  const H = 34;
  const pts = scalePoints(values, { width: W, height: H, padTop: 4, padBottom: 4 });
  const line = smoothPath(pts);
  const area = `${line} L${W},${H} L0,${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
      focusable="false"
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={fill} stopOpacity="0.4" />
              <stop offset="1" stopColor={fill} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Delta vs periode sebelumnya — pil berwarna, bukan teks polos, biar kebaca sekilas. */
function DeltaPill({
  up,
  delta,
  label,
  isNew,
  newLabel,
  tone = 'light',
  compact = false,
}: {
  up: boolean;
  delta: string;
  label: string;
  isNew?: boolean;
  newLabel: string;
  tone?: 'light' | 'dark';
  /** Sembunyikan teks pembanding ("vs bulan lalu") di mobile — dipakai kartu
   *  yang tampil 2 kolom di layar sempit, di situ pil-nya gak muat utuh. */
  compact?: boolean;
}) {
  if (isNew) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
          tone === 'dark' ? 'bg-[#D4A04A]/18 text-[#e6bd76]' : 'bg-[#f6ecd8] text-[#8a6d1f]',
        )}
      >
        ✦ {newLabel}
      </span>
    );
  }

  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold',
        tone === 'dark'
          ? up
            ? 'bg-[#7bbd8f]/15 text-[#8ed3a3]'
            : 'bg-[#e0796d]/15 text-[#f0968a]'
          : up
            ? 'bg-[#e7f2ea] text-[#2f6b41]'
            : 'bg-[#fbeae8] text-[#b23b30]',
      )}
    >
      <Icon size={12.5} strokeWidth={2.5} aria-hidden />
      {delta}
      <span
        className={cn(
          'font-medium',
          compact && 'hidden sm:inline',
          tone === 'dark' ? 'text-[#9a9084]' : 'text-muted',
        )}
      >
        {label}
      </span>
    </span>
  );
}

type StatShape = {
  key: string;
  value: string;
  raw: number;
  unit: StatUnit;
  delta: string;
  up: boolean;
  isNew?: boolean;
};

/**
 * Kartu utama Ringkasan — pendapatan tampil beda sendiri (gelap, besar) karena
 * itu angka yang paling dicari Owner; tiga metrik lain jadi kartu pendamping.
 */
export function HeroRevenueCard({
  stat,
  label,
  periodLabel,
  compareLabel,
  newLabel,
  sparkline,
}: {
  stat: StatShape;
  label: string;
  periodLabel: string;
  compareLabel: string;
  newLabel: string;
  sparkline: number[];
}) {
  const animated = useCountUp(stat.raw);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#1a1410] p-6 text-white sm:p-7">
      {/* Cahaya emas lembut — bikin kartu kerasa "premium" tanpa nambah elemen. */}
      <div
        className="pointer-events-none absolute -top-28 -right-20 h-72 w-72 rounded-full bg-[#D4A04A]/12 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.16em] text-[#D4A04A] uppercase">
            <Wallet size={13} strokeWidth={2} aria-hidden />
            {label}
          </div>
          {/* Ukurannya lebih kalem dari versi "Rp13,0 jt" dulu — nominal penuh
              jauh lebih panjang, dan kalau tetap 44px dia meluber ke area
              sparkline. Perlu diingat `formatIDR` memakai NBSP di antara "Rp"
              dan angkanya, jadi teks ini tidak pernah mau pecah baris sendiri:
              kalau kesempitan dia menembus kotaknya, bukan turun ke bawah. */}
          <div className="mt-2.5 font-serif text-[26px] leading-none font-extrabold tabular-nums sm:text-[30px]">
            {formatStat(animated, stat.unit)}
          </div>
          <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
            <DeltaPill
              up={stat.up}
              delta={stat.delta}
              label={compareLabel}
              isNew={stat.isNew}
              newLabel={newLabel}
              tone="dark"
            />
            <span className="text-[11.5px] text-[#8d8377]">{periodLabel}</span>
          </div>
        </div>

        {/* Dipersempit dari w-56 supaya kolom nominal di kiri kebagian ruang —
            nominal penuh butuh lebih lebar ketimbang "Rp13,0 jt" dulu. */}
        <div className="w-full shrink-0 sm:w-44">
          <Sparkline
            values={sparkline}
            stroke="#D4A04A"
            fill="#D4A04A"
            className="h-16 w-full sm:h-20"
          />
        </div>
      </div>
    </div>
  );
}

const STAT_ICONS: Record<string, typeof Users> = {
  statRevenue: Wallet,
  statBooking: CalendarCheck,
  statVisitors: Users,
  statAvgPerBooking: Receipt,
};

/**
 * Kartu metrik pendamping — ikon, angka, delta, dan sparkline mini opsional.
 * `sparkline` sengaja opsional: di halaman Penginapan kartunya berfungsi
 * sebagai ringkasan pembanding (bintangnya tabel peringkat di bawah), jadi
 * dibiarkan padat tanpa grafik.
 */
export function StatCard({
  stat,
  label,
  compareLabel,
  newLabel,
  sparkline,
}: {
  stat: StatShape;
  label: string;
  compareLabel: string;
  newLabel: string;
  sparkline?: number[];
}) {
  const animated = useCountUp(stat.raw);
  const Icon = STAT_ICONS[stat.key];

  return (
    // Kartu ini tampil 2 kolom di mobile, jadi tipografi & padding-nya naik
    // bertahap: ukuran desktop dipakai apa adanya di layar sempit bikin angka
    // sampai memaksa kartunya melebar.
    <div className="group rounded-2xl border border-[#ece6d8] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#D4A04A]/45 hover:shadow-[0_10px_28px_-12px_rgba(26,20,16,0.22)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        {/* Tinggi 2 baris dijatah di mobile: label sependek "Total Booking" muat
            1 baris sedangkan "Total Pengunjung" jadi 2, dan tanpa jatah ini
            angka di kartu sebelah-sebelahan jadi gak sejajar. */}
        <div className="text-muted min-h-8 text-[11.5px] leading-snug font-medium sm:min-h-0 sm:text-[12.5px]">
          {label}
        </div>
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#f6ecd8] text-[#9a7420] transition-colors group-hover:bg-[#D4A04A]/25 sm:h-8 sm:w-8 sm:rounded-[10px]">
            <Icon size={14} strokeWidth={2} aria-hidden className="sm:hidden" />
            <Icon size={15} strokeWidth={2} aria-hidden className="hidden sm:block" />
          </span>
        )}
      </div>

      {/* Ukurannya dipatok ke nominal terpanjang yang realistis, bukan ke angka
          pendek seperti "6" — biar semua kartu seragam. Di mobile kartunya cuma
          selebar ~128px: 16px muat sampai "Rp 999.999.999", sedangkan 18px
          sudah meluber bahkan di nominal puluhan juta. */}
      <div className="text-forest-700 mt-1.5 font-serif text-[16px] leading-tight font-extrabold tabular-nums sm:mt-2 sm:text-[21px]">
        {formatStat(animated, stat.unit)}
      </div>

      <div className="mt-2.5 sm:mt-3">
        <DeltaPill
          up={stat.up}
          delta={stat.delta}
          label={compareLabel}
          isNew={stat.isNew}
          newLabel={newLabel}
          compact
        />
      </div>

      {sparkline && (
        <Sparkline
          values={sparkline}
          stroke={stat.up ? '#2f6b41' : '#b23b30'}
          fill={stat.up ? '#2f6b41' : '#b23b30'}
          className="mt-3 h-7 w-full sm:mt-3.5 sm:h-9"
        />
      )}
    </div>
  );
}

/**
 * Kartu "tipe terlaris" — jawaban paling cepat buat pertanyaan Owner "yang
 * mana yang paling laku?". Sengaja bukan angka murni seperti kartu lain, jadi
 * layoutnya pun beda: nama tipe yang jadi bintangnya, bukan nominal.
 */
export function TopTypeCard({
  label,
  name,
  category,
  revenueText,
  sharePct,
  shareLabel,
  emptyText,
}: {
  label: string;
  name: string | null;
  category?: string;
  revenueText?: string;
  sharePct?: number;
  shareLabel: string;
  emptyText: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#ece6d8] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#D4A04A]/45 hover:shadow-[0_10px_28px_-12px_rgba(26,20,16,0.22)] sm:p-5">
      <div className="flex items-start justify-between gap-2">
        {/* Tinggi 2 baris dijatah di mobile: label sependek "Total Booking" muat
            1 baris sedangkan "Total Pengunjung" jadi 2, dan tanpa jatah ini
            angka di kartu sebelah-sebelahan jadi gak sejajar. */}
        <div className="text-muted min-h-8 text-[11.5px] leading-snug font-medium sm:min-h-0 sm:text-[12.5px]">
          {label}
        </div>
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[#f6ecd8] text-[#9a7420] transition-colors group-hover:bg-[#D4A04A]/25 sm:h-8 sm:w-8 sm:rounded-[10px]">
          <Crown size={14} strokeWidth={2} aria-hidden className="sm:hidden" />
          <Crown size={15} strokeWidth={2} aria-hidden className="hidden sm:block" />
        </span>
      </div>

      {name ? (
        <>
          <div className="text-forest-700 mt-1.5 truncate font-serif text-[17px] leading-tight font-extrabold sm:mt-2 sm:text-[21px]">
            {name}
          </div>
          <div className="text-muted mt-0.5 text-[11px] sm:text-[11.5px]">{category}</div>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 sm:mt-3">
            <span className="text-[12.5px] font-bold tabular-nums sm:text-[13.5px]">
              {revenueText}
            </span>
            {typeof sharePct === 'number' && (
              <span className="text-muted text-[11px] sm:text-[11.5px]">
                {sharePct}% {shareLabel}
              </span>
            )}
          </div>
          {typeof sharePct === 'number' && (
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#f0ebe0]">
              <div
                className="h-full rounded-full bg-[#D4A04A]"
                style={{ width: `${Math.min(100, sharePct)}%` }}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-muted mt-4 text-[13px]">{emptyText}</div>
      )}
    </div>
  );
}

/**
 * Kartu okupansi — pakai cincin radial, bukan sparkline: nilainya persentase
 * dengan batas jelas 0–100%, jadi "seberapa penuh" lebih kebaca sebagai
 * lingkaran terisi ketimbang garis tren.
 */
export function OccupancyCard({
  stat,
  label,
  compareLabel,
  newLabel,
  capacityNote,
}: {
  stat: StatShape;
  label: string;
  compareLabel: string;
  newLabel: string;
  capacityNote: string;
}) {
  const animated = useCountUp(stat.raw);
  const pct = Math.max(0, Math.min(100, animated));
  const r = 52;
  const C = 2 * Math.PI * r;

  return (
    // `h-full` + kolom fleksibel: kartu ini sebaris sama grafik tren yang jauh
    // lebih tinggi, jadi isinya sengaja dipusatkan biar sisa ruangnya kelihatan
    // disengaja — bukan kartu pendek yang ngambang di atas kolom kosong.
    <div className="group flex h-full flex-col rounded-2xl border border-[#ece6d8] bg-white p-5 transition-all hover:border-[#D4A04A]/45 hover:shadow-[0_10px_28px_-12px_rgba(26,20,16,0.22)]">
      <div className="text-muted text-[12.5px] font-medium">{label}</div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-5">
        <div className="relative h-32 w-32">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden>
            <circle cx="64" cy="64" r={r} fill="none" stroke="#f0ebe0" strokeWidth="11" />
            {/* Di 0% arc-nya sengaja gak dirender sama sekali: `strokeLinecap`
                bulat tetap menggambar titik walau panjang dash-nya nol, dan
                titik nyasar itu kebaca seolah okupansinya bukan benar-benar 0. */}
            {pct > 0 && (
              <circle
                cx="64"
                cy="64"
                r={r}
                fill="none"
                stroke="#1B4332"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={`${((pct / 100) * C).toFixed(1)} ${C.toFixed(1)}`}
              />
            )}
          </svg>
          <div className="text-forest-700 absolute inset-0 flex items-center justify-center font-serif text-[30px] font-extrabold tabular-nums">
            {Math.round(pct)}%
          </div>
        </div>

        <DeltaPill
          up={stat.up}
          delta={stat.delta}
          label={compareLabel}
          isNew={stat.isNew}
          newLabel={newLabel}
        />
      </div>

      <div className="text-muted text-center text-[11.5px] leading-snug">{capacityNote}</div>
    </div>
  );
}
