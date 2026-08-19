/**
 * Bidang garis kontur — bahasa visual utama situs ini.
 *
 * Satu kurva punggungan digambar ulang dengan pergeseran vertikal yang
 * jaraknya terus menyempit (30 → 9 px). Di peta topografi, kontur yang merapat
 * berarti lereng mengcuram — jadi bentuknya membawa keterangan nyata tentang
 * medan kawah, bukan tekstur hiasan yang ditempel.
 *
 * Sebelumnya elemen ini dipasang di opacity 0.55 di balik mask dan praktis
 * tidak terlihat. Kalau sesuatu dijadikan tanda tangan halaman, ia harus
 * cukup berani untuk dikenali.
 */

const RIDGE =
  'M -40 232 C 150 228 280 216 420 192 C 540 172 660 128 800 116 C 920 106 1040 132 1160 154 C 1210 163 1240 167 1264 169';

const OFFSETS = [0, 30, 57, 81, 102, 120, 135, 147, 156];

type ContourProps = {
  /**
   * `mast` — memudar ke kiri supaya tidak menabrak judul halaman.
   * `band` — terbaca penuh selebar layar, dipakai sebagai jeda antar seksi.
   */
  variant?: 'mast' | 'band';
  className?: string;
} & React.SVGProps<SVGSVGElement>;

export function Contour({ variant = 'mast', className = '', ...rest }: ContourProps) {
  const id = variant === 'mast' ? 'contour-mast' : 'contour-band';

  return (
    <svg
      viewBox="0 0 1200 300"
      preserveAspectRatio={variant === 'mast' ? 'xMaxYMid slice' : 'none'}
      aria-hidden
      focusable="false"
      className={className}
      {...rest}
    >
      <defs>
        <linearGradient id={`${id}-fade`} x1="0" x2="1">
          {variant === 'mast' ? (
            /* Separuh kiri dijaga benar-benar kosong. Judul dan paragraf
               pembuka hidup di sana; garis yang menyeberang ke belakang teks
               bukan tekstur, itu cuma bikin susah dibaca. */
            <>
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
              <stop offset="72%" stopColor="white" stopOpacity="0.6" />
              <stop offset="100%" stopColor="white" stopOpacity="1" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="22%" stopColor="white" stopOpacity="1" />
              <stop offset="78%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </>
          )}
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect width="1200" height="300" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g
        mask={`url(#${id}-mask)`}
        fill="none"
        stroke="currentColor"
        strokeWidth={variant === 'band' ? 1.25 : 1}
        vectorEffect="non-scaling-stroke"
      >
        {OFFSETS.map((dy, i) => (
          <path
            key={dy}
            d={RIDGE}
            transform={`translate(0 ${dy})`}
            opacity={(variant === 'band' ? 0.72 : 0.6) - i * 0.055}
            /* Jeda per garis dipakai animasi gambar-sendiri di globals.css;
               tanpa ini kesembilan garis muncul serempak dan terbaca seperti
               satu blok, bukan medan yang ditarik. */
            style={{ '--draw-index': i } as React.CSSProperties}
          />
        ))}
      </g>
    </svg>
  );
}

/**
 * Jeda antar seksi: bidang kontur selebar layar dengan datum ketinggian yang
 * dibaca dari garisnya. Menggantikan garis pemisah polos — di situs tentang
 * sebuah kawah, pemisahnya sendiri bisa menyatakan medannya.
 */
export function ContourBand({ label }: { label?: string }) {
  return (
    <div
      className="text-mineral-600 relative isolate h-36 overflow-hidden sm:h-48"
      aria-hidden
    >
      <Contour variant="band" className="absolute inset-0 h-full w-full" />
      {label && (
        <span className="text-ash-600 absolute inset-x-0 bottom-7 text-center text-[11.5px] tracking-[0.3em] uppercase">
          {label}
        </span>
      )}
    </div>
  );
}
