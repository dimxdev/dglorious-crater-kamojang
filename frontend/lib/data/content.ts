// Konten statis homepage & tentang (MOCK). Nanti sebagian bisa dari CMS.

import type { HomeImageKey } from '@/lib/data/images';
import type { IconName } from '@/lib/icons';

/** Urutan array ini menentukan layout: elemen pertama jadi kartu besar. */
export type Attraction = {
  icon: IconName;
  photo: HomeImageKey;
  name: string;
  desc: string;
};

export const attractions: Attraction[] = [
  {
    icon: 'Flame',
    photo: 'attractionKawah',
    name: 'Kawah Geothermal',
    desc: 'Saksikan uap belerang mengepul dari perut bumi di salah satu ladang panas bumi tertua Indonesia.',
  },
  {
    icon: 'WavesLadder',
    photo: 'attractionAirPanas',
    name: 'Pemandian Air Panas',
    desc: 'Berendam di kolam air panas alami yang menenangkan otot, dikelilingi kabut pegunungan.',
  },
  {
    icon: 'Tent',
    photo: 'attractionGlamping',
    name: 'Glamping Mewah',
    desc: 'Menginap ditemani bintang dan kabut, dengan kenyamanan setara hotel di tengah alam.',
  },
  {
    icon: 'Coffee',
    photo: 'attractionKopi',
    name: 'Kopi & Kabut',
    desc: 'Nikmati kopi robusta khas dataran tinggi sambil memandang lanskap berkabut yang syahdu.',
  },
];

export type InfoItem = { icon: IconName; title: string; lines: string[] };

export const infoPraktis: InfoItem[] = [
  {
    icon: 'Clock',
    title: 'Jam Buka',
    lines: ['Setiap hari', '07.00 – 18.00 WIB'],
  },
  { icon: 'Ticket', title: 'Tiket Masuk', lines: ['mulai Rp25.000', '/orang'] },
  {
    icon: 'MapPin',
    title: 'Lokasi',
    lines: ['Kamojang, perbatasan', 'Bandung – Garut'],
  },
  {
    icon: 'Thermometer',
    title: 'Suhu',
    lines: ['Sejuk 16–22°C', 'bawa jaket ya'],
  },
];

export const galleryFacilities = [
  { icon: '♨️', label: 'Air Panas' },
  { icon: '🍳', label: 'Restoran' },
  { icon: '📶', label: 'Wi-Fi' },
  { icon: '🅿️', label: 'Parkir Luas' },
  { icon: '🔥', label: 'Api Unggun' },
  { icon: '🥾', label: 'Jalur Trekking' },
  { icon: '☕', label: 'Cafe' },
  { icon: '🚻', label: 'Toilet Umum' },
  { icon: '🕌', label: 'Musala' },
  { icon: '📷', label: 'Spot Foto' },
  { icon: '🛎️', label: 'Resepsionis 24 Jam' },
  { icon: '🚑', label: 'P3K' },
];

/** Slot galeri (label placeholder) untuk halaman Tentang. */
export const gallerySlots = [
  'Panorama kawah',
  'Kolam air panas',
  'Interior glamping',
  'Jalur trekking',
  'Suasana malam',
  'Cafe & kopi',
];
