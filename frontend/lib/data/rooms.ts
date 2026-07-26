// Data penginapan — sumber: "Pricelist Penginapan DGCK" (PDF resmi klien).
// TODO(FASE 4/5): ganti dengan fetch ke `GET /room-types` & `GET /room-types/:slug`.
// Konten deskripsi/tagline masih ditulis sendiri (belum dari klien) — teks
// disimpan sebagai LocalizedText (ID + EN), di-resolve lewat
// `localizeRoom(src, locale)`. Field harga/kapasitas/fasilitas SUDAH dari
// data resmi; tandai per-field kalau masih dugaan/estimasi.

import type { HomeImageKey } from '@/lib/data/images';
import { type LocalizedText, pick } from '@/lib/data/localized';
import type { IconName } from '@/lib/icons';
import type { Locale } from '@/lib/i18n/config';

/** Fasilitas dengan label per-bahasa (ikon tidak diterjemahkan). */
type FacilitySource = { icon: IconName; label: LocalizedText };

/** Bentuk mentah (mock) sebelum di-localize — mirip baris DB + translations. */
export type RoomSource = {
  slug: string;
  /** Kategori unit: Cottage / Glamping / Tenda / Area Camping. */
  category: LocalizedText;
  priceWeekday: number;
  priceWeekend: number;
  /** Kapasitas standar (sudah termasuk di harga dasar). */
  capacity: number;
  bedInfo: LocalizedText;
  bathroomInfo: LocalizedText;
  /**
   * Tarif tambah orang di luar kapasitas (§"KETENTUAN PENAMBAHAN ORANG" di
   * price list). Sebagian besar unit punya 2 opsi: `extraBedPrice` (dikasih
   * kasur tambahan) & `extraNoBedPrice` (tanpa kasur tambahan, cuma nambah
   * kapasitas). Glorious Campervan beda: flat `extraFlatPrice`/orang.
   */
  extraBedPrice?: number;
  extraNoBedPrice?: number;
  extraFlatPrice?: number;
  /** ESTIMASI — jumlah unit belum dikonfirmasi klien, lihat PROJECT.md §11. */
  totalUnits: number;
  checkInTime: string;
  checkOutTime: string;
  /** Emoji fallback untuk <ImagePlaceholder> di halaman yang belum berfoto. */
  coverIcon: string;
  /** Foto asli — lihat lib/data/images.ts. TODO: semua masih pinjam foto
   * generik, ganti begitu foto asli tiap unit tersedia dari klien. */
  photo: HomeImageKey;
  available: boolean;
  name: LocalizedText;
  tagline: LocalizedText;
  description: LocalizedText;
  facilities: FacilitySource[];
  rules: LocalizedText[];
};

/** Fasilitas yang sudah di-resolve ke satu bahasa. */
export type RoomFacility = { icon: IconName; label: string };

/** Bentuk yang dikonsumsi komponen — teks sudah jadi satu bahasa. */
export type RoomType = {
  slug: string;
  category: string;
  priceWeekday: number;
  priceWeekend: number;
  capacity: number;
  bedInfo: string;
  bathroomInfo: string;
  extraBedPrice?: number;
  extraNoBedPrice?: number;
  extraFlatPrice?: number;
  totalUnits: number;
  checkInTime: string;
  checkOutTime: string;
  coverIcon: string;
  photo: HomeImageKey;
  available: boolean;
  name: string;
  tagline: string;
  description: string;
  facilities: RoomFacility[];
  rules: string[];
};

// Aturan menginap generik (BUKAN dari price list — masih asumsi umum,
// perlu dikonfirmasi ke klien seperti aturan lain di PROJECT.md §11).
const GENERIC_RULES: LocalizedText[] = [
  { id: 'Dilarang merokok di dalam unit', en: 'No smoking inside the unit' },
  { id: 'Jam tenang mulai pukul 22.00 WIB', en: 'Quiet hours from 10 PM' },
  {
    id: 'Tamu wajib menunjukkan kode booking saat check-in',
    en: 'Guests must show the booking code at check-in',
  },
];

export const roomSources: RoomSource[] = [
  {
    slug: 'eagle-hill',
    category: { id: 'Cottage', en: 'Cottage' },
    priceWeekday: 1999000,
    priceWeekend: 2499000,
    capacity: 2,
    bedInfo: { id: '1 Queen Bed', en: '1 Queen Bed' },
    bathroomInfo: {
      id: 'Kamar mandi privat + private hot spring',
      en: 'Private bathroom + private hot spring',
    },
    extraBedPrice: 300000,
    extraNoBedPrice: 200000,
    totalUnits: 3,
    checkInTime: '14.00 WIB',
    checkOutTime: '12.00 WIB',
    coverIcon: '🏡',
    photo: 'roomCottage',
    available: true,
    name: { id: 'Eagle Hill', en: 'Eagle Hill' },
    tagline: {
      id: 'Cottage privat dengan kolam air panas sendiri',
      en: 'Private cottage with your own hot spring',
    },
    description: {
      id: 'Cottage kayu nyaman dengan private hot spring di teras, kasur queen empuk, dan pemandangan hutan berkabut. Dilengkapi Smart TV & Netflix, mini bar, serta pemanas ruangan untuk malam yang sejuk di Kamojang.',
      en: "A cozy wooden cottage with a private hot spring on the terrace, a plush queen bed, and misty forest views. Complete with Smart TV & Netflix, a mini bar, and a room heater for Kamojang's cool nights.",
    },
    facilities: [
      { icon: 'UtensilsCrossed', label: { id: 'Sarapan', en: 'Breakfast' } },
      { icon: 'Wind', label: { id: 'Penghangat Ruangan', en: 'Room Heater' } },
      { icon: 'Tv', label: { id: 'Smart TV & Netflix', en: 'Smart TV & Netflix' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
      { icon: 'Droplets', label: { id: 'Water Heater', en: 'Water Heater' } },
      { icon: 'Bath', label: { id: 'Toiletries, Slipper & Hairdryer', en: 'Toiletries, Slippers & Hairdryer' } },
      { icon: 'Martini', label: { id: 'Mini Bar', en: 'Mini Bar' } },
      { icon: 'Armchair', label: { id: 'Meja & Kursi Santai', en: 'Lounge Table & Chairs' } },
    ],
    rules: GENERIC_RULES,
  },
  {
    slug: 'royal-kahuripan',
    category: { id: 'Glamping', en: 'Glamping' },
    priceWeekday: 1000000,
    priceWeekend: 1200000,
    capacity: 2,
    bedInfo: { id: '1 Queen Bed', en: '1 Queen Bed' },
    bathroomInfo: { id: 'Kamar mandi privat', en: 'Private bathroom' },
    extraBedPrice: 300000,
    extraNoBedPrice: 200000,
    totalUnits: 4,
    checkInTime: '14.00 WIB',
    checkOutTime: '12.00 WIB',
    coverIcon: '⛺',
    photo: 'roomGlamping',
    available: true,
    name: { id: 'Royal Kahuripan', en: 'Royal Kahuripan' },
    tagline: { id: 'Glamping nyaman ala hotel bintang', en: 'Hotel-comfort glamping' },
    description: {
      id: 'Tenda glamping dengan kasur queen empuk, kamar mandi privat berair panas, dan fasilitas selengkap kamar hotel — TV digital, mini bar, hingga meja santai di depan tenda.',
      en: 'A glamping tent with a plush queen bed, a private hot-water bathroom, and amenities as complete as a hotel room — digital TV, a mini bar, and a lounge table right outside the tent.',
    },
    facilities: [
      { icon: 'UtensilsCrossed', label: { id: 'Sarapan', en: 'Breakfast' } },
      { icon: 'Wind', label: { id: 'Penghangat Ruangan', en: 'Room Heater' } },
      { icon: 'Tv', label: { id: 'TV Digital', en: 'Digital TV' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
      { icon: 'Droplets', label: { id: 'Water Heater', en: 'Water Heater' } },
      { icon: 'Bath', label: { id: 'Toiletries & Slipper', en: 'Toiletries & Slippers' } },
      { icon: 'Martini', label: { id: 'Mini Bar', en: 'Mini Bar' } },
      { icon: 'Armchair', label: { id: 'Meja & Kursi Santai', en: 'Lounge Table & Chairs' } },
    ],
    rules: GENERIC_RULES,
  },
  {
    slug: 'camp-jamuju',
    category: { id: 'Tenda', en: 'Tent' },
    priceWeekday: 1200000,
    priceWeekend: 1500000,
    capacity: 4,
    bedInfo: { id: '4 Single Bed', en: '4 Single Beds' },
    bathroomInfo: {
      id: 'Kamar mandi bersama (air panas)',
      en: 'Shared bathroom (hot water)',
    },
    extraBedPrice: 250000,
    extraNoBedPrice: 175000,
    totalUnits: 5,
    checkInTime: '14.00 WIB',
    checkOutTime: '12.00 WIB',
    coverIcon: '⛺',
    photo: 'roomTenda',
    available: true,
    name: { id: 'Camp Jamuju', en: 'Camp Jamuju' },
    tagline: { id: 'Tenda keluarga dengan halaman luas', en: 'Family tent with a spacious yard' },
    description: {
      id: 'Tenda kanvas untuk 4 orang dengan area halaman samping yang lega, api unggun bersama, dan coffee corner untuk menghangatkan badan sebelum tidur.',
      en: 'A canvas tent for 4, with a spacious side yard, a shared bonfire, and a coffee corner to warm up before sleep.',
    },
    facilities: [
      { icon: 'UtensilsCrossed', label: { id: 'Sarapan', en: 'Breakfast' } },
      { icon: 'Flame', label: { id: 'Kayu Bakar & Bonfire (Bersama)', en: 'Firewood & Bonfire (Shared)' } },
      { icon: 'Trees', label: { id: 'Area Halaman Samping', en: 'Side Yard Area' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
      { icon: 'Armchair', label: { id: 'Meja & Kursi Santai', en: 'Lounge Table & Chairs' } },
      { icon: 'Coffee', label: { id: 'Coffee Corner', en: 'Coffee Corner' } },
    ],
    rules: GENERIC_RULES,
  },
  {
    slug: 'camp-rasamala',
    category: { id: 'Tenda', en: 'Tent' },
    priceWeekday: 800000,
    priceWeekend: 950000,
    capacity: 4,
    bedInfo: { id: '4 Single Bed', en: '4 Single Beds' },
    bathroomInfo: {
      id: 'Kamar mandi bersama (air panas)',
      en: 'Shared bathroom (hot water)',
    },
    extraBedPrice: 250000,
    extraNoBedPrice: 175000,
    totalUnits: 4,
    checkInTime: '14.00 WIB',
    checkOutTime: '12.00 WIB',
    coverIcon: '⛺',
    photo: 'attractionGlamping',
    available: true,
    name: { id: 'Camp Rasamala', en: 'Camp Rasamala' },
    tagline: { id: 'Tenda dengan api unggun privat', en: 'Tent with a private bonfire' },
    description: {
      id: 'Tenda kanvas untuk 4 orang dengan bonfire privat sendiri — cocok untuk keluarga atau rombongan yang ingin bersantai di api unggun tanpa berbagi dengan tamu lain.',
      en: 'A canvas tent for 4, with your own private bonfire — ideal for families or groups who want to unwind by the fire without sharing with other guests.',
    },
    facilities: [
      { icon: 'UtensilsCrossed', label: { id: 'Sarapan', en: 'Breakfast' } },
      { icon: 'Flame', label: { id: 'Kayu Bakar & Bonfire Private', en: 'Firewood & Private Bonfire' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
      { icon: 'Armchair', label: { id: 'Meja & Kursi Santai', en: 'Lounge Table & Chairs' } },
      { icon: 'Coffee', label: { id: 'Coffee Corner', en: 'Coffee Corner' } },
    ],
    rules: GENERIC_RULES,
  },
  {
    slug: 'camp-cakrawala',
    category: { id: 'Tenda', en: 'Tent' },
    priceWeekday: 600000,
    priceWeekend: 725000,
    capacity: 3,
    bedInfo: { id: '2 Single Bed', en: '2 Single Beds' },
    bathroomInfo: {
      id: 'Kamar mandi bersama (air panas)',
      en: 'Shared bathroom (hot water)',
    },
    extraBedPrice: 250000,
    extraNoBedPrice: 175000,
    totalUnits: 6,
    checkInTime: '14.00 WIB',
    checkOutTime: '12.00 WIB',
    coverIcon: '⛺',
    photo: 'attractionKopi',
    available: true,
    name: { id: 'Camp Cakrawala', en: 'Camp Cakrawala' },
    tagline: { id: 'Tenda ringkas untuk berdua-tiga', en: 'Compact tent for two or three' },
    description: {
      id: 'Tenda kanvas ringkas untuk 3 orang, pilihan pas untuk yang datang berdua atau bertiga dan ingin merasakan berkemah santai tanpa ribet.',
      en: 'A compact canvas tent for 3, a great fit for couples or small groups who want a relaxed camping experience without the hassle.',
    },
    facilities: [
      { icon: 'UtensilsCrossed', label: { id: 'Sarapan', en: 'Breakfast' } },
      { icon: 'Flame', label: { id: 'Kayu Bakar & Bonfire (Bersama)', en: 'Firewood & Bonfire (Shared)' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
      { icon: 'Armchair', label: { id: 'Meja & Kursi Santai', en: 'Lounge Table & Chairs' } },
      { icon: 'Coffee', label: { id: 'Coffee Corner', en: 'Coffee Corner' } },
    ],
    rules: GENERIC_RULES,
  },
  {
    slug: 'glorious-campervan',
    category: { id: 'Area Camping', en: 'Camping Area' },
    priceWeekday: 350000,
    priceWeekend: 400000,
    capacity: 4,
    bedInfo: { id: 'Kavling 5×7 Meter', en: '5×7 m Plot' },
    bathroomInfo: { id: 'Kamar mandi bersama', en: 'Shared bathroom' },
    extraFlatPrice: 55000,
    totalUnits: 8,
    checkInTime: '14.00 WIB',
    checkOutTime: '12.00 WIB',
    coverIcon: '🚐',
    photo: 'locationValley',
    available: true,
    name: { id: 'Glorious Campervan', en: 'Glorious Campervan' },
    tagline: { id: 'Bawa mobil & tendamu sendiri', en: 'Bring your own car & tent' },
    description: {
      id: 'Kavling terbuka 5×7 meter untuk campervan atau tenda pribadimu sendiri, lengkap dengan sumber listrik, coffee corner, dan akses ke semua fasilitas umum DGCK.',
      en: 'An open 5×7 m plot for your own campervan or tent, complete with a power source, a coffee corner, and access to all DGCK common facilities.',
    },
    facilities: [
      { icon: 'Flame', label: { id: 'Kayu Bakar & Bonfire (Bersama)', en: 'Firewood & Bonfire (Shared)' } },
      { icon: 'Plug', label: { id: 'Sumber Listrik', en: 'Power Source' } },
      { icon: 'Coffee', label: { id: 'Coffee Corner', en: 'Coffee Corner' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
    ],
    rules: GENERIC_RULES,
  },
];

/** Resolve satu RoomSource ke bahasa aktif. */
export function localizeRoom(src: RoomSource, locale: Locale): RoomType {
  return {
    slug: src.slug,
    category: pick(src.category, locale),
    priceWeekday: src.priceWeekday,
    priceWeekend: src.priceWeekend,
    capacity: src.capacity,
    bedInfo: pick(src.bedInfo, locale),
    bathroomInfo: pick(src.bathroomInfo, locale),
    extraBedPrice: src.extraBedPrice,
    extraNoBedPrice: src.extraNoBedPrice,
    extraFlatPrice: src.extraFlatPrice,
    totalUnits: src.totalUnits,
    checkInTime: src.checkInTime,
    checkOutTime: src.checkOutTime,
    coverIcon: src.coverIcon,
    photo: src.photo,
    available: src.available,
    name: pick(src.name, locale),
    tagline: pick(src.tagline, locale),
    description: pick(src.description, locale),
    facilities: src.facilities.map((f) => ({ icon: f.icon, label: pick(f.label, locale) })),
    rules: src.rules.map((r) => pick(r, locale)),
  };
}

/** Semua tenda, sudah di-localize ke bahasa aktif. */
export function localizeRooms(locale: Locale): RoomType[] {
  return roomSources.map((r) => localizeRoom(r, locale));
}

/** Sumber mentah per slug (dipakai di server component sebelum di-localize). */
export function getRoomSource(slug: string): RoomSource | undefined {
  return roomSources.find((r) => r.slug === slug);
}
