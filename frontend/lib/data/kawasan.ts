// Fasilitas kawasan — disalin dari spanduk resmi di lokasi (foto, 2026-08-18).
//
// ATURAN ISI: nama ditulis PERSIS seperti tercetak di spanduk. Tidak ada
// deskripsi karangan tentang bentuk atau rasanya, karena tidak ada satu pun
// dari tempat ini yang pernah kami lihat fotonya. Kalau nanti klien mengirim
// foto dan keterangan asli, barulah ditambahkan.
//
// Pengelompokannya bukan hiasan. Daftar aslinya berurutan alfabetis dan
// menyembunyikan hal yang paling menarik dari tempat ini: ada EMPAT kawah
// bernama, EMPAT cara berendam air panas, dan TIGA jembatan. Dikelompokkan
// begini, angkanya sendiri yang bercerita.

import { type LocalizedText, pick } from '@/lib/data/localized';
import type { IconName } from '@/lib/icons';
import type { Locale } from '@/lib/i18n/config';

type ZoneSource = {
  key: string;
  icon: IconName;
  name: LocalizedText;
  /** Satu kalimat, faktual. Bukan ajakan, bukan pujian. */
  note: LocalizedText;
  items: LocalizedText[];
};

export type Zone = {
  key: string;
  icon: IconName;
  name: string;
  note: string;
  items: string[];
  count: number;
};

const zoneSources: ZoneSource[] = [
  {
    key: 'kawah',
    icon: 'Flame',
    name: { id: 'Kawah', en: 'Craters' },
    note: {
      id: 'Empat kawah dengan nama sendiri-sendiri, semuanya di dalam satu kawasan.',
      en: 'Four separately named craters, all inside the same grounds.',
    },
    items: [
      { id: 'Kawah Kamojang' },
      { id: 'Kawah Manuk' },
      { id: 'Kawah Berecek' },
      { id: 'Kawah Kereta Api' },
    ],
  },
  {
    key: 'air-panas',
    icon: 'WavesLadder',
    name: { id: 'Air panas', en: 'Hot water' },
    note: {
      id: 'Empat cara berendam, dari kolam terbuka sampai kamar tertutup.',
      en: 'Four ways to soak, from an open pool to a private room.',
    },
    items: [
      { id: 'Kolam Berendam Air Panas Alami', en: 'Natural Hot Spring Pool' },
      { id: 'Kolam Bundar dan Resto (Nirwana Pool)', en: 'Round Pool & Resto (Nirwana Pool)' },
      { id: 'Kamar Berendam Private (Jacuzzi)', en: 'Private Soaking Room (Jacuzzi)' },
      { id: 'Sauna Alami (Kawah Hujan)', en: 'Natural Sauna (Kawah Hujan)' },
    ],
  },
  {
    key: 'jalur',
    icon: 'Landmark',
    name: { id: 'Jembatan & jalur', en: 'Bridges & trails' },
    note: {
      id: 'Tiga jembatan dan satu jalur hutan yang menghubungkan sisi-sisi kawasan.',
      en: 'Three bridges and one forest trail linking the far sides of the grounds.',
    },
    items: [
      { id: 'Jembatan Gantung (Glory Bridge)', en: 'Suspension Bridge (Glory Bridge)' },
      { id: 'Jembatan Gantung (Jungle Bridge)', en: 'Suspension Bridge (Jungle Bridge)' },
      { id: 'Miniatur Jembatan Kuning (Crater Bridge)', en: 'Yellow Bridge Replica (Crater Bridge)' },
      { id: 'Jungle Track' },
    ],
  },
  {
    key: 'menginap',
    icon: 'Tent',
    name: { id: 'Menginap', en: 'Staying over' },
    note: {
      id: 'Tenda dan glamping di dalam kawasan, dengan enam tipe unit.',
      en: 'Tents and glamping on the grounds, across six unit types.',
    },
    items: [{ id: 'Camp Tent dan Glamping', en: 'Camp Tent & Glamping' }],
  },
  {
    key: 'umum',
    icon: 'ConciergeBell',
    name: { id: 'Fasilitas umum', en: 'General facilities' },
    note: {
      id: 'Yang dipakai semua pengunjung, menginap maupun tidak.',
      en: 'Used by every visitor, whether staying the night or not.',
    },
    items: [
      { id: 'Area Parkir Luas', en: 'Large Parking Area' },
      { id: 'Amphiteater', en: 'Amphitheatre' },
      { id: 'Billiard' },
      { id: 'Mushola', en: 'Prayer Room' },
      { id: 'Playground Area' },
      { id: 'Restaurant dan Cafe', en: 'Restaurant & Cafe' },
      { id: 'Spot Foto Alam dan Kawah Lainnya', en: 'Other Nature & Crater Photo Spots' },
    ],
  },
];

export function getZones(locale: Locale): Zone[] {
  return zoneSources.map((z) => ({
    key: z.key,
    icon: z.icon,
    name: pick(z.name, locale),
    note: pick(z.note, locale),
    items: z.items.map((i) => pick(i, locale)),
    count: z.items.length,
  }));
}

/** Jumlah seluruh fasilitas — dipakai judul seksi supaya angkanya tidak
 *  ditulis tangan lalu basi begitu daftarnya berubah. */
export function totalFacilities(): number {
  return zoneSources.reduce((n, z) => n + z.items.length, 0);
}
