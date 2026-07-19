// Konten statis homepage & tentang (MOCK). Nanti sebagian bisa dari CMS.

export const attractions = [
  {
    icon: '🌋',
    name: 'Kawah Geothermal',
    desc: 'Saksikan uap belerang mengepul dari perut bumi di salah satu ladang panas bumi tertua Indonesia.',
  },
  {
    icon: '♨️',
    name: 'Pemandian Air Panas',
    desc: 'Berendam di kolam air panas alami yang menenangkan otot, dikelilingi kabut pegunungan.',
  },
  {
    icon: '⛺',
    name: 'Glamping Mewah',
    desc: 'Menginap ditemani bintang dan kabut, dengan kenyamanan setara hotel di tengah alam.',
  },
  {
    icon: '☕',
    name: 'Kopi & Kabut',
    desc: 'Nikmati kopi robusta khas dataran tinggi sambil memandang lanskap berkabut yang syahdu.',
  },
];

export const infoPraktis = [
  { icon: '🕗', title: 'Jam Buka', lines: ['Setiap hari', '07.00 – 18.00 WIB'] },
  { icon: '🎫', title: 'Tiket Masuk', lines: ['mulai Rp25.000', '/orang'] },
  { icon: '📍', title: 'Lokasi', lines: ['Kamojang, perbatasan', 'Bandung – Garut'] },
  { icon: '🌡️', title: 'Suhu', lines: ['Sejuk 16–22°C', 'bawa jaket ya'] },
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
