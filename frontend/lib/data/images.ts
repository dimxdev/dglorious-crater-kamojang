// Manifest foto + atribusi.
//
// Semua foto diunduh dari Pexels dan disimpan lokal di public/images/home/
// (bukan hotlink) supaya tidak perlu konfigurasi images.remotePatterns dan
// tidak rapuh kalau URL CDN berubah.
//
// Aturan pengisian:
// - `license` ditulis persis nama lisensinya: "Pexels License". BUKAN "CC0" —
//   Pexels bukan CC0, dan menyebutnya begitu salah secara hukum.
// - `sourceUrl` menunjuk ke halaman foto (bisa diverifikasi ulang), bukan URL
//   file di CDN.
// - `alt` mendeskripsikan isi foto yang BENAR-BENAR dipilih, bukan brief
//   pencariannya.
// - `objectPosition` diisi kalau subjek foto tidak di tengah, supaya tidak
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
    alt: 'Kawah vulkanik dengan uap putih mengepul dari batuan kelabu, dikelilingi lereng berumput hijau di bawah langit mendung.',
    photographer: 'Chen Te',
    sourceUrl:
      'https://www.pexels.com/photo/volcano-crater-in-yangmingshan-national-park-16728513/',
    license: 'Pexels License',
  },
  attractionKawah: {
    src: '/images/home/attraction-kawah.jpg',
    alt: 'Dinding batu vulkanik berkerak belerang kekuningan dengan uap panas mengepul dari celah-celahnya.',
    photographer: 'Ilya Batorshin',
    sourceUrl: 'https://www.pexels.com/photo/rock-cliff-in-fog-11312489/',
    license: 'Pexels License',
  },
  attractionAirPanas: {
    src: '/images/home/attraction-air-panas.jpg',
    alt: 'Kolam air panas alami berwarna keputihan dengan uap tebal mengepul, dikelilingi endapan mineral dan bukit berhutan.',
    photographer: 'Balázs Gábor',
    sourceUrl:
      'https://www.pexels.com/photo/geothermal-hot-spring-in-new-zealand-mist-38579192/',
    license: 'Pexels License',
    // Kolamnya ada di 59–76% tinggi frame; crop tengah cuma dapat uap polos.
    objectPosition: 'center 80%',
  },
  attractionGlamping: {
    src: '/images/home/attraction-glamping.jpg',
    alt: 'Beberapa tenda glamping kanvas di atas dek kayu, di antara pohon pinus yang tertutup kabut tebal.',
    photographer: 'Nguyên Đoàn',
    sourceUrl:
      'https://www.pexels.com/photo/serene-camping-in-misty-da-l-t-forest-32602810/',
    license: 'Pexels License',
  },
  attractionKopi: {
    src: '/images/home/attraction-kopi.jpg',
    alt: 'Kebun dataran tinggi diselimuti kabut pagi, dengan satu pohon besar menjulang di lereng yang hijau gelap.',
    photographer: 'Donn Gimhara',
    sourceUrl:
      'https://www.pexels.com/photo/misty-morning-in-a-foggy-tea-plantation-31321526/',
    license: 'Pexels License',
    // Bagian atas frame nyaris kabut putih polos; dorong crop ke bawah supaya
    // baris kebun dan bangunannya yang kelihatan, bukan kotak putih kosong.
    objectPosition: 'center 100%',
  },
  roomGlamping: {
    src: '/images/home/room-glamping.jpg',
    alt: 'Interior tenda glamping dengan kasur berselimut rajut abu-abu, lampu gantung anyaman, dan bangku kayu.',
    photographer: 'Anastasia Shuraeva',
    sourceUrl: 'https://www.pexels.com/photo/bed-in-a-tent-4989092/',
    license: 'Pexels License',
    // Kasur mulai di 60% tinggi frame — tanpa ini kartunya cuma atap tenda kosong.
    objectPosition: 'center 83%',
  },
  roomCottage: {
    src: '/images/home/room-cottage.jpg',
    alt: 'Kabin kayu beratap hijau di tepi hutan pinus yang tertutup kabut tebal.',
    photographer: 'Sami Abdullah',
    sourceUrl:
      'https://www.pexels.com/photo/wooden-house-on-a-forest-field-covered-in-fog-14213582/',
    license: 'Pexels License',
    // Sumbernya sangat tinggi (0.56); crop tengah memotong bagian bawah kabin.
    objectPosition: 'center 57%',
  },
  roomTenda: {
    src: '/images/home/room-tenda.jpg',
    alt: 'Tenda kubah kuning berdiri sendiri di hutan pinus yang berkabut.',
    photographer: 'Raka Miftah',
    sourceUrl:
      'https://www.pexels.com/photo/yellow-tent-in-the-woods-on-a-foggy-day-5470670/',
    license: 'Pexels License',
    // Tendanya ada di 63–86% tinggi frame. Tanpa ini tendanya kepotong habis
    // dan kartunya cuma menampilkan kabut + batang pohon.
    objectPosition: 'center 90%',
  },
  locationValley: {
    src: '/images/home/location-valley.jpg',
    alt: 'Pemandangan dari ketinggian: kabut mengalir menutupi lembah berhutan di lereng pegunungan.',
    photographer: 'Dajana Reçi',
    sourceUrl:
      'https://www.pexels.com/photo/misty-mountain-landscape-with-rolling-fog-29090841/',
    license: 'Pexels License',
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
