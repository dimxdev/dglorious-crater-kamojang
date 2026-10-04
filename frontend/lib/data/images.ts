// Manifest foto + atribusi.
//
// Semua gambar dihasilkan dengan Google Gemini (AI) dan disimpan lokal di
// public/images/home/. Ini ILUSTRASI suasana kawasan, BUKAN foto asli unit —
// ganti dengan foto asli dari klien begitu tersedia (cukup timpa file dengan
// nama yang sama, lalu perbarui `alt` kalau isinya berubah).
//
// Aturan pengisian:
// - `alt` mendeskripsikan isi gambar yang BENAR-BENAR dipakai.
// - `objectPosition` diisi kalau subjek tidak di tengah, supaya tidak
//   terpotong saat di-crop `object-cover` ke kotak yang rasionya beda.

export type SourcedImage = {
  src: string;
  alt: string;
  photographer: string;
  sourceUrl: string;
  license: string;
  /** Nilai CSS object-position; default 'center' kalau tidak diisi. */
  objectPosition?: string;
};

export const homeImages = {
  hero: {
    src: '/images/home/hero-crater.jpg',
    alt: 'Ilustrasi kawah vulkanik dengan uap putih mengepul dari tanah berbatu dan endapan belerang kekuningan, dikelilingi hutan pegunungan yang berkabut.',
    photographer: 'Google Gemini (dibuat AI)',
    sourceUrl: 'https://gemini.google.com',
    license: 'Ilustrasi AI',
  },
  attractionKawah: {
    src: '/images/home/attraction-kawah.jpg',
    alt: 'Ilustrasi dinding batu vulkanik berkerak belerang kuning dengan uap panas mengepul dari celahnya, latar hutan berkabut.',
    photographer: 'Google Gemini (dibuat AI)',
    sourceUrl: 'https://gemini.google.com',
    license: 'Ilustrasi AI',
  },
  attractionAirPanas: {
    src: '/images/home/attraction-air-panas.jpg',
    alt: 'Ilustrasi kolam air panas alami berwarna putih kebiruan dengan uap tebal, dikelilingi endapan mineral dan bukit berhutan.',
    photographer: 'Google Gemini (dibuat AI)',
    sourceUrl: 'https://gemini.google.com',
    license: 'Ilustrasi AI',
  },
  attractionGlamping: {
    src: '/images/home/attraction-glamping.jpg',
    alt: 'Ilustrasi tenda glamping kanvas di atas dek kayu di antara pohon pinus yang diselimuti kabut pagi.',
    photographer: 'Google Gemini (dibuat AI)',
    sourceUrl: 'https://gemini.google.com',
    license: 'Ilustrasi AI',
  },
  attractionKopi: {
    src: '/images/home/attraction-kopi.jpg',
    alt: 'Ilustrasi kebun dataran tinggi berkabut pagi dengan deretan tanaman hijau dan satu pohon besar menjulang.',
    photographer: 'Google Gemini (dibuat AI)',
    sourceUrl: 'https://gemini.google.com',
    license: 'Ilustrasi AI',
  },
  roomGlamping: {
    src: '/images/home/room-glamping.jpg',
    alt: 'Ilustrasi interior tenda glamping dengan kasur berselimut rajut abu-abu, lampu gantung anyaman, dan jendela menghadap hutan pinus.',
    photographer: 'Google Gemini (dibuat AI)',
    sourceUrl: 'https://gemini.google.com',
    license: 'Ilustrasi AI',
  },
  roomCottage: {
    src: '/images/home/room-cottage.jpg',
    alt: 'Ilustrasi kabin kayu beratap hijau di tepi hutan pinus berkabut, dengan kolam air panas privat di terasnya.',
    photographer: 'Google Gemini (dibuat AI)',
    sourceUrl: 'https://gemini.google.com',
    license: 'Ilustrasi AI',
  },
  roomTenda: {
    src: '/images/home/room-tenda.jpg',
    alt: 'Ilustrasi tenda kubah oranye-kuning di hutan pinus yang berkabut, dengan dua kursi lipat di depannya.',
    photographer: 'Google Gemini (dibuat AI)',
    sourceUrl: 'https://gemini.google.com',
    license: 'Ilustrasi AI',
  },
  locationValley: {
    src: '/images/home/location-valley.jpg',
    alt: 'Ilustrasi pemandangan dari ketinggian: kabut mengalir menutupi lembah berhutan di lereng pegunungan.',
    photographer: 'Google Gemini (dibuat AI)',
    sourceUrl: 'https://gemini.google.com',
    license: 'Ilustrasi AI',
  },
} as const satisfies Record<string, SourcedImage>;

export type HomeImageKey = keyof typeof homeImages;

/**
 * Ambil satu entri manifest sebagai `SourcedImage`.
 *
 * `as const satisfies` di atas sengaja dipakai supaya manifest wajib lengkap,
 * tapi efek sampingnya tipe hasilnya menyempit ke literal — field opsional
 * seperti `objectPosition` jadi tidak terlihat pada entri yang tidak mengisinya.
 * Accessor ini melebarkannya kembali ke `SourcedImage`.
 */
export function getImage(key: HomeImageKey): SourcedImage {
  return homeImages[key];
}
