// Data penginapan (MOCK) — bentuknya menyerupai respons API backend.
// TODO(FASE 4/5): ganti dengan fetch ke `GET /room-types` & `GET /room-types/:slug`.
// Konten deskripsi/aturan aslinya berasal dari tabel room_type_translations.

export type RoomFacility = { icon: string; label: string };

export type RoomType = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  totalUnits: number;
  checkInTime: string;
  checkOutTime: string;
  coverIcon: string;
  facilities: RoomFacility[];
  rules: string[];
  available: boolean;
};

export const rooms: RoomType[] = [
  {
    slug: 'glamping-deluxe',
    name: 'Glamping Deluxe',
    tagline: 'Tenda mewah tepi kawah',
    description:
      'Tenda glamping mewah dengan pemandangan langsung ke kawah geothermal. Dilengkapi kasur king nyaman, penghangat, dan kamar mandi air panas alami. Terbangun oleh kabut pagi dan uap belerang yang mengepul di kejauhan.',
    pricePerNight: 850000,
    capacity: 2,
    totalUnits: 5,
    checkInTime: '14.00 WIB',
    checkOutTime: '12.00 WIB',
    coverIcon: '⛺',
    facilities: [
      { icon: '♨️', label: 'Air panas alami' },
      { icon: '🍳', label: 'Sarapan' },
      { icon: '📶', label: 'Wi-Fi' },
      { icon: '❄️', label: 'AC' },
      { icon: '🚿', label: 'Kamar mandi dalam' },
      { icon: '🅿️', label: 'Parkir' },
    ],
    rules: [
      'Dilarang merokok di dalam unit',
      'Hewan peliharaan tidak diperbolehkan',
      'Jam tenang mulai pukul 22.00 WIB',
      'Tamu wajib menunjukkan kode booking saat check-in',
    ],
    available: true,
  },
  {
    slug: 'cottage-family',
    name: 'Cottage Keluarga',
    tagline: 'Cabin kayu untuk keluarga',
    description:
      'Cottage kayu luas untuk keluarga, dengan ruang tamu hangat, dapur kecil, dan teras menghadap hutan pegunungan. Cocok untuk berkumpul ditemani secangkir kopi dan gemericik alam.',
    pricePerNight: 1500000,
    capacity: 4,
    totalUnits: 3,
    checkInTime: '14.00 WIB',
    checkOutTime: '12.00 WIB',
    coverIcon: '🏡',
    facilities: [
      { icon: '♨️', label: 'Air panas alami' },
      { icon: '🍳', label: 'Sarapan' },
      { icon: '📶', label: 'Wi-Fi' },
      { icon: '❄️', label: 'AC' },
      { icon: '🍽️', label: 'Dapur' },
      { icon: '🛋️', label: 'Ruang tamu' },
    ],
    rules: [
      'Maksimal 4 tamu per unit',
      'Dilarang merokok di dalam unit',
      'Jam tenang mulai pukul 22.00 WIB',
      'Tamu wajib menunjukkan kode booking saat check-in',
    ],
    available: true,
  },
  {
    slug: 'tenda-standar',
    name: 'Tenda Standar',
    tagline: 'Nyaman & terjangkau',
    description:
      'Tenda nyaman dengan harga terjangkau, cocok untuk backpacker yang ingin merasakan sejuknya udara pegunungan Kamojang tanpa menguras kantong.',
    pricePerNight: 500000,
    capacity: 2,
    totalUnits: 8,
    checkInTime: '14.00 WIB',
    checkOutTime: '12.00 WIB',
    coverIcon: '⛺',
    facilities: [
      { icon: '♨️', label: 'Air panas' },
      { icon: '🍳', label: 'Sarapan' },
      { icon: '🚻', label: 'Kamar mandi bersama' },
    ],
    rules: [
      'Kamar mandi bersama',
      'Dilarang merokok di dalam unit',
      'Jam tenang mulai pukul 22.00 WIB',
      'Tamu wajib menunjukkan kode booking saat check-in',
    ],
    available: true,
  },
];

export function getRoomBySlug(slug: string): RoomType | undefined {
  return rooms.find((r) => r.slug === slug);
}
