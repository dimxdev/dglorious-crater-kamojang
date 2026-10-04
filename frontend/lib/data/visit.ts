// Konten perencanaan kunjungan: FAQ + rute akses.
//
// Dipisah dari `content.ts` (yang isinya etalase: atraksi, galeri, tiket)
// karena dua hal ini menjawab pertanyaan "aman nggak saya ke sana?" — bukan
// memamerkan tempatnya. Pola datanya sama: LocalizedText + getter per-locale.

import { type LocalizedText, pick } from '@/lib/data/localized';
import type { IconName } from '@/lib/icons';
import type { Locale } from '@/lib/i18n/config';

// ── FAQ ───────────────────────────────────────────────────────
//
// SEMUA jawaban di bawah diturunkan langsung dari 12 poin Syarat & Ketentuan
// resmi klien (tabel `settings`, key `terms_conditions_id`) — bukan karangan.
// Nomor poin sumbernya ditulis di komentar tiap entri supaya gampang diaudit
// ulang kalau S&K-nya berubah.
//
// Alasan halaman ini ada: situs tidak punya booking online, jadi SETIAP
// reservasi lewat percakapan WhatsApp dengan admin. Tiap pertanyaan yang
// sudah terjawab di situs adalah satu bolak-balik chat yang tidak perlu
// terjadi — dan satu alasan lebih sedikit bagi calon tamu untuk menunda.

type FaqSource = { q: LocalizedText; a: LocalizedText };
export type FaqItem = { q: string; a: string };

const faqSources: FaqSource[] = [
  {
    // S&K poin 1, 3, 12
    q: { id: 'Bagaimana cara memesan penginapan?', en: 'How do I book a stay?' },
    a: {
      id: 'Hubungi admin lewat WhatsApp untuk mengecek ketersediaan tanggal dan menyepakati harga. Setelah deal, bayar DP 50% lewat transfer bank, lalu kirimkan foto bukti transfernya ke nomor WhatsApp yang sama. Belum ada pemesanan otomatis di situs ini — semuanya lewat admin.',
      en: 'Message our admin on WhatsApp to check date availability and agree on a rate. Once settled, pay a 50% deposit by bank transfer and send the transfer receipt to that same WhatsApp number. There is no self-service booking on this site yet — every reservation goes through an admin.',
    },
  },
  {
    // S&K poin 1 & 2
    q: { id: 'Berapa DP-nya, dan sampai kapan berlaku?', en: 'How much is the deposit, and how long does it hold?' },
    a: {
      id: 'DP 50% dari total, paling lambat 1×24 jam setelah kesepakatan. Lewat dari itu, tanggal yang kamu pesan otomatis dilepas kembali dan bisa diambil tamu lain.',
      en: 'A 50% deposit, due within 24 hours of agreeing. After that window the dates are released automatically and another guest can take them.',
    },
  },
  {
    // S&K poin 5 & 6
    q: { id: 'Kalau batal atau ingin pindah tanggal?', en: 'What if I cancel or need to move dates?' },
    a: {
      id: 'Pembatalan setelah pembayaran tidak bisa direfund — dananya hangus. Tapi pindah tanggal masih bisa, asalkan dikonfirmasi paling lambat 7 hari sebelum tanggal check-in semula.',
      en: 'Cancellations after payment are non-refundable. Moving your dates is still possible, as long as you confirm at least 7 days before the original check-in date.',
    },
  },
  {
    // S&K poin 11
    q: { id: 'Jam berapa check-in dan check-out?', en: 'What are the check-in and check-out times?' },
    a: {
      id: 'Check-in mulai pukul 14.00, check-out pukul 12.00. Early check-in dan late check-out tidak bisa dilayani karena unitnya perlu disiapkan untuk tamu berikutnya.',
      en: 'Check-in from 2 PM, check-out at 12 PM. Early check-in and late check-out are not available — each unit needs turnaround time for the next guest.',
    },
  },
  {
    // S&K poin 7 & 8
    q: { id: 'Anak-anak dihitung sebagai satu orang?', en: 'Do children count toward capacity?' },
    a: {
      id: 'Anak umur 6 tahun ke atas dihitung sebagai satu orang dewasa. Di bawah 5 tahun belum dihitung. Kalau rombonganmu melebihi kapasitas unit, bisa tambah extra bed atau charge person — tapi biasanya lebih nyaman dan lebih murah kalau langsung ambil tipe yang lebih besar atau menambah tenda.',
      en: 'Children aged 6 and over count as one adult each; under-5s are not counted. If your group exceeds a unit’s capacity you can add an extra bed or pay a per-person charge — though it is usually more comfortable and cheaper to take a larger unit or add a second tent.',
    },
  },
  {
    // S&K poin 9
    q: { id: 'Boleh membawa hewan peliharaan?', en: 'Can I bring a pet?' },
    a: {
      id: 'Belum bisa. Hewan peliharaan tidak diperkenankan selama menginap.',
      en: 'Not at this time. Pets are not permitted during your stay.',
    },
  },
  {
    // Bukan dari S&K — dari data suhu di halaman beranda (16–22°C, ±1.500 mdpl)
    q: { id: 'Sedingin apa di sana?', en: 'How cold does it get?' },
    a: {
      id: 'Di ketinggian sekitar 1.500 mdpl, suhunya berkisar 16–22°C dan turun lagi selepas magrib. Bawa jaket, kaus kaki, dan alas kaki yang nyaman untuk jalanan berbatu — kabut sering turun pagi dan sore.',
      en: 'At roughly 1,500 m the air sits between 16–22°C and drops further after sunset. Bring a jacket, socks, and footwear you can walk rocky paths in — mist rolls in most mornings and late afternoons.',
    },
  },
];

export function getFaq(locale: Locale): FaqItem[] {
  return faqSources.map((f) => ({ q: pick(f.q, locale), a: pick(f.a, locale) }));
}

// ── Rute akses ────────────────────────────────────────────────
//
// ⚠️ PERLU KONFIRMASI KLIEN. Jarak & waktu tempuh di bawah dirangkum dari
// sumber publik tentang kawasan Kawah Kamojang (Desa Laksana, Kec. Ibun,
// Kab. Bandung), BUKAN dari data yang diberikan klien. Angkanya ditulis
// membulat dan diberi tanda "±" karena memang perkiraan yang berubah menurut
// lalu lintas. Verifikasi ke klien sebelum situs ini dipublikasikan.

type RouteSource = {
  icon: IconName;
  from: LocalizedText;
  duration: LocalizedText;
  distance: LocalizedText;
  note: LocalizedText;
};
export type RouteItem = {
  icon: IconName;
  from: string;
  duration: string;
  distance: string;
  note: string;
};

const routeSources: RouteSource[] = [
  {
    icon: 'MapPin',
    from: { id: 'Dari Kota Bandung', en: 'From Bandung city' },
    duration: { id: '±1 jam 30 menit', en: '±1 hr 30 min' },
    distance: { id: '±40 km', en: '±40 km' },
    note: {
      id: 'Lewat Majalaya–Ibun. Jalur ini paling pendek, tapi sebagian aspalnya bergelombang — santai saja, jangan diburu-buru.',
      en: 'Via Majalaya–Ibun. This is the shortest way in, though parts of the asphalt are rough — take it slowly.',
    },
  },
  {
    icon: 'MapPin',
    from: { id: 'Dari Kota Garut', en: 'From Garut city' },
    duration: { id: '±1 jam', en: '±1 hr' },
    distance: { id: '±25 km', en: '±25 km' },
    note: {
      id: 'Lewat Samarang. Jaraknya lebih jauh dari jalur Majalaya, tapi jalannya sudah teraspal baik dan lebih nyaman untuk mobil rendah.',
      en: 'Via Samarang. Longer than the Majalaya route but properly surfaced, and easier on a low-clearance car.',
    },
  },
];

export function getRoutes(locale: Locale): RouteItem[] {
  return routeSources.map((r) => ({
    icon: r.icon,
    from: pick(r.from, locale),
    duration: pick(r.duration, locale),
    distance: pick(r.distance, locale),
    note: pick(r.note, locale),
  }));
}

/** Pencarian Google Maps untuk lokasi — dipakai tombol "Buka di Peta". */
export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  "D'Glorious Crater Kamojang",
)}`;
