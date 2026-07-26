// Konten statis homepage & tentang (MOCK). Teks disimpan per-bahasa
// (LocalizedText) lalu di-resolve lewat getter `get*(locale)`. Nanti sebagian
// bisa dari CMS.

import type { HomeImageKey } from '@/lib/data/images';
import { type LocalizedText, pick } from '@/lib/data/localized';
import type { IconName } from '@/lib/icons';
import type { Locale } from '@/lib/i18n/config';

// ── Daya tarik ────────────────────────────────────────────────
// Daftar LENGKAP semua spot wisata (dipakai halaman Tentang). Homepage cuma
// menampilkan yang `featured: true` (kurasi 4 paling ikonik) — lihat
// `getFeaturedAttractions`. Urutan array menentukan layout bento di homepage:
// elemen featured pertama jadi kartu besar.
//
// TODO: "Sky Bridge" & "Jalur Trekking" masih placeholder (nama dugaan,
// foto pinjam). "Nirwana Pool", "Kolam Berendam (Kawah Hujan)", dan
// "Jacuzzi Private" namanya SUDAH dikonfirmasi dari price list resmi
// klien — tapi fotonya masih pinjam foto lain, ganti begitu ada foto asli.
type AttractionSource = {
  icon: IconName;
  photo: HomeImageKey;
  name: LocalizedText;
  desc: LocalizedText;
  featured: boolean;
};
export type Attraction = {
  icon: IconName;
  photo: HomeImageKey;
  name: string;
  desc: string;
  featured: boolean;
};

const attractionSources: AttractionSource[] = [
  {
    icon: 'Flame',
    photo: 'attractionKawah',
    name: { id: 'Kawah Geothermal', en: 'Geothermal Crater' },
    desc: {
      id: 'Saksikan uap belerang mengepul dari perut bumi di salah satu ladang panas bumi tertua Indonesia.',
      en: "Watch sulfur steam rise from the earth at one of Indonesia's oldest geothermal fields.",
    },
    featured: true,
  },
  {
    icon: 'WavesLadder',
    photo: 'attractionAirPanas',
    name: { id: 'Nirwana Pool', en: 'Nirwana Pool' },
    desc: {
      id: 'Akses kolam eksklusif dengan pemandangan lembah, tersedia lewat paket Eksklusif atau Wisman — pengalaman berendam yang lebih privat dan tenang.',
      en: 'Exclusive pool access with a valley view, available through the Eksklusif or Wisman package — a more private and serene soaking experience.',
    },
    featured: true,
  },
  {
    icon: 'Landmark',
    photo: 'locationValley',
    name: { id: 'Sky Bridge', en: 'Sky Bridge' },
    desc: {
      id: 'Jembatan gantung yang membentang di atas lembah berkabut — spot foto paling dicari pengunjung.',
      en: "A suspension bridge stretching over the misty valley — visitors' most sought-after photo spot.",
    },
    featured: true,
  },
  {
    icon: 'Bath',
    photo: 'hero',
    name: { id: 'Kolam Berendam (Kawah Hujan)', en: 'Kawah Hujan Soaking Pool' },
    desc: {
      id: 'Kolam berendam alami yang termasuk dalam paket dasar kunjungan — cara paling terjangkau untuk merasakan hangatnya air panas Kamojang.',
      en: "A natural soaking pool included in the basic visit package — the most affordable way to experience Kamojang's warm waters.",
    },
    featured: true,
  },
  {
    icon: 'Droplets',
    photo: 'roomGlamping',
    name: { id: 'Jacuzzi Private', en: 'Private Jacuzzi' },
    desc: {
      id: 'Kamar rendam privat dengan jacuzzi, pilihan lain di paket Eksklusif untuk yang ingin berendam tanpa keramaian.',
      en: 'A private soaking room with a jacuzzi — an alternative in the Eksklusif package for those who prefer to soak away from the crowd.',
    },
    featured: false,
  },
  {
    icon: 'Tent',
    photo: 'attractionGlamping',
    name: { id: 'Glamping Mewah', en: 'Luxury Glamping' },
    desc: {
      id: 'Menginap ditemani bintang dan kabut, dengan kenyamanan setara hotel di tengah alam.',
      en: 'Stay under the stars and mist, with hotel-grade comfort in the middle of nature.',
    },
    featured: false,
  },
  {
    icon: 'Coffee',
    photo: 'attractionKopi',
    name: { id: 'Kopi & Kabut', en: 'Coffee & Mist' },
    desc: {
      id: 'Nikmati kopi robusta khas dataran tinggi sambil memandang lanskap berkabut yang syahdu.',
      en: 'Enjoy highland robusta coffee while gazing over a serene, misty landscape.',
    },
    featured: false,
  },
  {
    icon: 'Footprints',
    photo: 'roomTenda',
    name: { id: 'Jalur Trekking', en: 'Trekking Trail' },
    desc: {
      id: 'Susuri jalur setapak menembus hutan pinus, cocok untuk yang ingin bergerak sebelum bersantai.',
      en: 'Follow a footpath through the pine forest — perfect for stretching your legs before relaxing.',
    },
    featured: false,
  },
];

/** Semua spot wisata (dipakai halaman Tentang — §"Daya Tarik Wisata"). */
export function getAttractions(locale: Locale): Attraction[] {
  return attractionSources.map((a) => ({
    icon: a.icon,
    photo: a.photo,
    name: pick(a.name, locale),
    desc: pick(a.desc, locale),
    featured: a.featured,
  }));
}

/** Kurasi 4 spot paling ikonik untuk teaser homepage. */
export function getFeaturedAttractions(locale: Locale): Attraction[] {
  return getAttractions(locale).filter((a) => a.featured);
}

// ── Info praktis ──────────────────────────────────────────────
// `href` opsional — kalau diisi, kartunya jadi link (dipakai utk "Tiket
// Masuk" yg mengarah ke rincian lengkap paket di halaman Tentang). `linkLabel`
// = teks CTA terpisah (ditampilkan beda gaya dari `lines`, bukan digabung
// jadi satu kalimat — supaya ajakan kliknya kelihatan menonjol).
type InfoSource = {
  icon: IconName;
  title: LocalizedText;
  lines: LocalizedText[];
  href?: string;
  linkLabel?: LocalizedText;
};
export type InfoItem = {
  icon: IconName;
  title: string;
  lines: string[];
  href?: string;
  linkLabel?: string;
};

const infoSources: InfoSource[] = [
  {
    icon: 'Clock',
    title: { id: 'Jam Buka', en: 'Opening Hours' },
    lines: [
      { id: 'Sen–Jum 08.00–22.00', en: 'Mon–Fri 08:00–22:00' },
      { id: 'Sab–Min 24 Jam', en: 'Sat–Sun 24 Hours' },
    ],
  },
  {
    icon: 'Ticket',
    title: { id: 'Tiket Masuk', en: 'Entry Ticket' },
    lines: [
      { id: 'mulai Rp25.000', en: 'from Rp25,000' },
      { id: '/orang', en: '/person' },
    ],
    href: '/tentang#tiket',
    linkLabel: { id: 'Lihat paket', en: 'See packages' },
  },
  {
    icon: 'MapPin',
    title: { id: 'Lokasi', en: 'Location' },
    lines: [
      { id: 'Kamojang, perbatasan', en: 'Kamojang, on the border' },
      { id: 'Bandung – Garut', en: 'of Bandung – Garut' },
    ],
  },
  {
    icon: 'Thermometer',
    title: { id: 'Suhu', en: 'Temperature' },
    lines: [
      { id: 'Sejuk 16–22°C', en: 'Cool 16–22°C' },
      { id: 'bawa jaket ya', en: 'bring a jacket' },
    ],
  },
];

export function getInfoPraktis(locale: Locale): InfoItem[] {
  return infoSources.map((i) => ({
    icon: i.icon,
    title: pick(i.title, locale),
    lines: i.lines.map((l) => pick(l, locale)),
    href: i.href,
    linkLabel: i.linkLabel ? pick(i.linkLabel, locale) : undefined,
  }));
}

// ── Harga tiket masuk (halaman Tentang) ───────────────────────
// Data dari price list resmi Koperasi Alam Lestari / D'Glorious Crater
// Kamojang. Tarif berbeda tergantung jam kunjungan: 06.00–19.00 (siang)
// vs 19.00–06.00 (malam).
type TicketPackageSource = {
  key: string;
  name: LocalizedText;
  note?: LocalizedText;
  benefits: LocalizedText[];
  priceDay: number;
  priceNight: number;
};
export type TicketPackage = {
  key: string;
  name: string;
  note?: string;
  benefits: string[];
  priceDay: number;
  priceNight: number;
};

const ticketPackageSources: TicketPackageSource[] = [
  {
    key: 'basic',
    name: { id: 'Basic (Diamond)', en: 'Basic (Diamond)' },
    benefits: [
      { id: 'Asuransi', en: 'Insurance' },
      { id: 'Akses wisata DGCK', en: 'DGCK tourist area access' },
      {
        id: 'Akses kolam berendam (Kawah Hujan)',
        en: 'Kawah Hujan soaking pool access',
      },
    ],
    priceDay: 40000,
    priceNight: 25000,
  },
  {
    key: 'eksklusif',
    name: { id: 'Eksklusif (Platinum)', en: 'Eksklusif (Platinum)' },
    benefits: [
      { id: 'Semua benefit paket Basic', en: 'All Basic package benefits' },
      { id: 'Welcome drink', en: 'Welcome drink' },
      {
        id: 'Pilih satu: Nirwana Pool, kamar rendam private (jacuzzi), atau jasa fotografer',
        en: 'Choose one: Nirwana Pool, private jacuzzi room, or photographer service',
      },
    ],
    priceDay: 55000,
    priceNight: 55000,
  },
  {
    key: 'wisman',
    name: { id: 'Wisman', en: 'Foreign Visitor' },
    note: {
      id: 'Khusus wisatawan mancanegara',
      en: 'Foreign tourists only',
    },
    benefits: [
      { id: 'Welcome drink', en: 'Welcome drink' },
      {
        id: 'Exclusive pool (Nirwana Pool) atau hot tub private (jacuzzi)',
        en: 'Exclusive pool (Nirwana Pool) or private hot tub (jacuzzi)',
      },
    ],
    priceDay: 210000,
    priceNight: 210000,
  },
  {
    key: 'anak',
    name: { id: 'Anak 5–10 Tahun (Silver)', en: 'Children 5–10 (Silver)' },
    benefits: [
      { id: 'Menggunakan ketentuan paket Silver', en: 'Uses Silver package terms' },
    ],
    priceDay: 30000,
    priceNight: 20000,
  },
];

export function getTicketPackages(locale: Locale): TicketPackage[] {
  return ticketPackageSources.map((p) => ({
    key: p.key,
    name: pick(p.name, locale),
    note: p.note ? pick(p.note, locale) : undefined,
    benefits: p.benefits.map((b) => pick(b, locale)),
    priceDay: p.priceDay,
    priceNight: p.priceNight,
  }));
}

// ── Tarif parkir (halaman Tentang) ────────────────────────────
type ParkingFeeSource = { vehicle: LocalizedText; price: number };
export type ParkingFee = { vehicle: string; price: number };

const parkingFeeSources: ParkingFeeSource[] = [
  { vehicle: { id: 'Bus', en: 'Bus' }, price: 60000 },
  { vehicle: { id: 'Mobil', en: 'Car' }, price: 15000 },
  { vehicle: { id: 'Motor', en: 'Motorcycle' }, price: 5000 },
  { vehicle: { id: 'Sepeda', en: 'Bicycle' }, price: 2000 },
];

export function getParkingFees(locale: Locale): ParkingFee[] {
  return parkingFeeSources.map((p) => ({ vehicle: pick(p.vehicle, locale), price: p.price }));
}

// ── Fasilitas umum (halaman Tentang) ──────────────────────────
// Amenitas pendukung — beda dari "Daya Tarik Wisata" di atas (yang memang
// spot/pengalaman, bukan sekadar fasilitas). Air Panas & Jalur Trekking
// dipindah ke situ karena keduanya pengalaman/spot, bukan amenitas.
//
// Tiket DGCK, Keamanan 24 Jam, Resepsionis, Playground, Cratera Resto,
// Nirwana Pool & Resto, Room Service SUDAH dikonfirmasi — sama persis di
// setiap halaman "FASILITAS UMUM" pada price list penginapan resmi klien
// (berlaku untuk semua tamu, bukan cuma yang menginap). Sisanya (Wifi,
// Parkir, Api Unggun, Toilet, Musala, Spot Foto, P3K) masih asumsi umum.
type FacilitySource = { icon: IconName; label: LocalizedText };
export type Facility = { icon: IconName; label: string };

const facilitySources: FacilitySource[] = [
  { icon: 'Ticket', label: { id: 'Tiket DGCK', en: 'DGCK Ticket' } },
  { icon: 'ShieldCheck', label: { id: 'Keamanan 24 Jam', en: '24-Hour Security' } },
  { icon: 'ConciergeBell', label: { id: 'Resepsionis 24 Jam', en: '24-Hour Reception' } },
  { icon: 'Gamepad2', label: { id: 'Playground', en: 'Playground' } },
  { icon: 'UtensilsCrossed', label: { id: 'Cratera Resto', en: 'Cratera Resto' } },
  { icon: 'WavesLadder', label: { id: 'Nirwana Pool & Resto', en: 'Nirwana Pool & Resto' } },
  { icon: 'BellRing', label: { id: 'Room Service', en: 'Room Service' } },
  { icon: 'Wifi', label: { id: 'Wi-Fi', en: 'Wi-Fi' } },
  { icon: 'CircleParking', label: { id: 'Parkir Luas', en: 'Ample Parking' } },
  { icon: 'Flame', label: { id: 'Api Unggun', en: 'Campfire' } },
  { icon: 'Toilet', label: { id: 'Toilet Umum', en: 'Public Toilets' } },
  { icon: 'Moon', label: { id: 'Musala', en: 'Prayer Room' } },
  { icon: 'Camera', label: { id: 'Spot Foto', en: 'Photo Spots' } },
  { icon: 'Cross', label: { id: 'P3K', en: 'First Aid' } },
];

export function getFacilities(locale: Locale): Facility[] {
  return facilitySources.map((f) => ({ icon: f.icon, label: pick(f.label, locale) }));
}

// ── Galeri (halaman Tentang, layout bento) ────────────────────
// item ke-0 jadi sel besar 2×2, item ke-3 melebar 2 kolom.
type GallerySource = { photo: HomeImageKey; label: LocalizedText };
export type GalleryItem = { photo: HomeImageKey; label: string };

const gallerySources: GallerySource[] = [
  { photo: 'hero', label: { id: 'Panorama kawah', en: 'Crater panorama' } },
  { photo: 'attractionAirPanas', label: { id: 'Kolam air panas', en: 'Hot-spring pool' } },
  { photo: 'roomGlamping', label: { id: 'Interior glamping', en: 'Glamping interior' } },
  { photo: 'attractionGlamping', label: { id: 'Glamping di antara pinus', en: 'Glamping among the pines' } },
  { photo: 'roomCottage', label: { id: 'Kabin kayu', en: 'Wooden cabin' } },
  { photo: 'locationValley', label: { id: 'Lembah berkabut', en: 'Misty valley' } },
];

export function getGalleryItems(locale: Locale): GalleryItem[] {
  return gallerySources.map((g) => ({ photo: g.photo, label: pick(g.label, locale) }));
}
