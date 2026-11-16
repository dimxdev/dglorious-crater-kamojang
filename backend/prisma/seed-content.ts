/**
 * Seed konten CMS situs (company profile dwibahasa) — isinya disalin dari
 * data hardcode lama di frontend (`lib/data/*.ts`, `locales/*.json`, Footer,
 * dll.) sebelum dipindah ke DB.
 *
 * BUKAN bagian dari `prisma db seed` standar. Jalankan manual:
 *   npm run seed:content            # idempoten
 *   npm run seed:content -- --force # timpa SEMUA section dengan isi awal
 *
 * Idempoten: section dibuat hanya kalau key-nya belum ada (editan admin tidak
 * ditimpa kecuali `--force`); item per koleksi diisi hanya kalau koleksinya
 * masih kosong.
 *
 * Teks yang dulu menyebut jumlah dari daftar ("Enam tipe unit", "Empat kawah…")
 * sengaja ditulis ulang tanpa angka supaya tidak basi saat daftar diedit.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import type { ContentCollection } from '../src/generated/prisma/enums';
import {
  COLLECTION_SCHEMAS,
  SECTION_SCHEMAS,
} from '../src/site-content/content-schemas';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type L = { id: string; en: string };
const l = (id: string, en = ''): L => ({ id, en });

const IMG = '/images/home/';
const HERO = `${IMG}hero-crater.jpg`;
const VALLEY = `${IMG}location-valley.jpg`;
const KOPI = `${IMG}attraction-kopi.jpg`;

const MAPS_QUERY = "D'Glorious Crater Kamojang";
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  MAPS_QUERY,
)}`;

// ─────────────────────────────────────────────────────────────
// Section
// ─────────────────────────────────────────────────────────────
const SECTIONS: Record<string, unknown> = {
  home_hero: {
    title: l(
      'Menginap di Jantung Kawah Kamojang',
      'Stay in the Heart of Kamojang Crater',
    ),
    subtitle: l(
      'Kawah, kolam air panas alami, dan tenda di lereng 1.500 meter. Satu setengah jam berkendara dari Bandung.',
      'Craters, natural hot spring pools, and tents on a slope at 1,500 metres. An hour and a half from Bandung.',
    ),
    imageUrl: HERO,
  },
  home_attractions: {
    title: l('Yang Membuat Kamojang Istimewa', 'What Makes Kamojang Special'),
  },
  home_facilities_teaser: {
    body: l(
      'Kawah, kolam air panas, jembatan gantung, dan berbagai fasilitas lain di dalam satu kawasan.',
      'Craters, hot pools, suspension bridges, and plenty more facilities inside the same grounds.',
    ),
  },
  home_lodging: {
    title: l('Tidur ditemani kabut & bintang', 'Sleep among mist & stars'),
    subtitle: l(
      'Tarif akhir pekan berbeda, dan keduanya ditulis di tiap kartu.',
      'Weekend rates differ, and both are printed on every card.',
    ),
  },
  home_info: {
    title: l('Rencanakan kunjunganmu', 'Plan your visit'),
    imageUrl: VALLEY,
  },
  home_routes: {
    title: l('Cara ke sini', 'Getting here'),
    lead: l(
      'Hampir semua tamu menempuh perjalanan lebih dari satu jam untuk sampai ke sini. Ada dua jalur masuk, dan pilihannya bergantung pada mobil yang kamu bawa.',
      'Nearly every guest drives more than an hour to get here. Two roads lead in, and which one suits you depends on the car you are driving.',
    ),
    mapsUrl: MAPS_URL,
  },
  home_faq: {
    title: l('Yang sering ditanyakan', 'Common questions'),
    lead: l(
      'Reservasi diurus lewat WhatsApp bersama admin kami. Yang di bawah ini biasanya sudah menjawab sebelum kamu sempat bertanya.',
      'Reservations run through WhatsApp with our admin. The answers below usually land before you need to ask.',
    ),
  },
  home_cta: {
    title: l(
      'Kamar terbatas tiap akhir pekan.',
      'Rooms are limited every weekend.',
    ),
    subtitle: l(
      'Ketersediaan tanggal, harga, dan aturan DP diurus lewat WhatsApp bersama admin kami. Balasannya biasanya tidak lama.',
      'Dates, rates, and deposit terms are handled over WhatsApp with our admin. You usually will not wait long for a reply.',
    ),
    imageUrl: HERO,
  },
  about_intro: {
    title: l(
      "Dari Kawah Kamojang ke D'Glorious Crater",
      "From Kamojang Crater to D'Glorious Crater",
    ),
    lead: l(
      'Kawah Kamojang telah dikenal sejak era kolonial sebagai salah satu ladang panas bumi tertua di Indonesia.',
      'Kamojang Crater has been known since colonial times as one of the oldest geothermal fields in Indonesia.',
    ),
    stats: [
      { label: l('Berdiri', 'Founded'), value: l('2023', '2023') },
      {
        label: l('Ketinggian', 'Elevation'),
        value: l('±1.500 mdpl', '±1,500 masl'),
      },
      {
        label: l('Luas Kawasan', 'Estate Area'),
        value: l('12 Hektare', '12 Hectares'),
      },
    ],
  },
  about_history: {
    body: l(
      [
        'Uap yang keluar dari celah bebatuan dan bau belerang yang khas sudah lama jadi bagian keseharian warga sekitar. Bagi mereka kawah ini bukan cuma gejala alam. Ada cerita turun-temurun soal kekuatan bumi yang harus dihormati, dan ada mata air panas yang menghangatkan.',
        'Kawasan konservasi panas bumi ini sudah lama ramai didatangi peneliti dan pelancong. Pada 2023 D’Glorious Crater Kamojang mulai beroperasi di sini, menata ulang akses ke kawah, kolam air panas, dan area menginap tanpa mengubah karakter tempatnya.',
        'Pagi di sini hampir selalu berkabut. Siang sampai sore orang berkumpul di kolam air panas, dan begitu matahari turun suhunya ikut turun ke belasan derajat. Tamu yang menginap biasanya menghabiskan malam di depan tenda, bukan di dalamnya.',
        'Yang kami jaga sederhana: kawah dan hutan di sekitarnya tidak boleh rusak karena kami ada di sini. Sebagian kawasan sengaja dibiarkan apa adanya, dan jumlah tenda dibatasi supaya lereng ini tidak berubah jadi tempat parkir.',
      ].join('\n\n'),
      [
        'Steam from the cracks in the rock and the smell of sulfur have long been part of daily life here. To people nearby the crater is not just a natural feature. There are stories passed down about the power of the earth, and there is hot spring water that keeps you warm.',
        'This geothermal conservation area has drawn researchers and travellers for years. In 2023 D’Glorious Crater Kamojang began operating here, reworking access to the crater, the hot pools, and the places to stay without changing the character of the site.',
        'Mornings here are almost always foggy. Through the afternoon people gather at the hot pools, and once the sun drops the temperature follows it into the teens. Guests who stay the night usually spend it outside the tent rather than in it.',
        'What we protect is simple: the crater and the forest around it should not be worse off for our being here. Parts of the site are deliberately left alone, and the number of tents is capped so this slope does not turn into a car park.',
      ].join('\n\n'),
    ),
    imageUrl: KOPI,
  },
  about_attractions: { title: l('Daya Tarik Wisata', 'Tourist Attractions') },
  about_gallery: { title: l('Galeri', 'Gallery') },
  about_tickets: {
    title: l('Harga Tiket Masuk', 'Entry Ticket Prices'),
    note: l(
      'Harga bisa berubah sewaktu-waktu. Hubungi kami lewat WhatsApp untuk memastikan tarif terbaru.',
      'Prices can change. Message us on WhatsApp to confirm current rates.',
    ),
  },
  about_parking: { title: l('Tarif Parkir', 'Parking Fees') },
  facilities: {
    title: l('Apa saja yang ada di sana', 'What is actually there'),
    note: l(
      'Kawah, kolam air panas, dan jembatan gantung. Cukup untuk mengisi satu hari penuh tanpa keluar dari kawasan.',
      'Craters, hot pools, and suspension bridges. Enough to fill a whole day without leaving the grounds.',
    ),
    disclaimer: l(
      'Urutan di sini cuma pengelompokan, bukan denah. Letak sebenarnya di kawasan bisa berbeda.',
      'These are groupings, not a site plan. The real layout on the ground may differ.',
    ),
  },
  listing: {
    title: l('Pilih tempat menginapmu', 'Choose where to stay'),
    lead: l(
      'Dari tenda berdua sampai cottage dengan kolam air panas sendiri. Tarif akhir pekan berbeda, dan keduanya ditulis apa adanya di tiap kartu.',
      'From a tent for two to a cottage with its own hot pool. Weekend rates differ, and both are printed on every card.',
    ),
    helpTitle: l('Belum yakin yang mana?', 'Not sure which one?'),
    helpBody: l(
      'Kirim tanggal rencanamu dan jumlah orangnya. Admin kami yang cek unit mana yang muat dan tanggalnya masih kosong.',
      'Send us your dates and how many people. Our admin checks which unit fits and which dates are still open.',
    ),
  },
  room_detail: {
    childrenRule: l(
      'Anak usia 6 tahun ke atas dihitung sebagai 1 dewasa. Anak usia di bawah 5 tahun tidak dihitung dalam kapasitas. Jika jumlah tamu efektif melebihi kapasitas standar, tersedia opsi tambah orang sesuai tarif di atas.',
      'Children aged 6 and above count as 1 adult. Children under 5 are not counted toward capacity. If the effective guest count exceeds standard capacity, extra-guest rates apply as shown above.',
    ),
    universalFacilitiesNote: l(
      'Semua tamu juga mendapat akses fasilitas umum DGCK (Nirwana Pool & Resto, Room Service, Playground, dll).',
      "All guests also get access to DGCK's general facilities (Nirwana Pool & Resto, Room Service, Playground, and more).",
    ),
    priceNote: l(
      '*Harga dapat berubah saat High Season',
      '*Prices may change during High Season',
    ),
  },
  terms: {
    title: l('Syarat & Ketentuan', 'Terms & Conditions'),
    subtitle: l(
      "Mohon dibaca sebelum melakukan reservasi penginapan di D'Glorious Crater Kamojang.",
      "Please read before making a lodging reservation at D'Glorious Crater Kamojang.",
    ),
    questionTitle: l(
      'Masih ada yang ingin ditanyakan?',
      'Anything else you need to know?',
    ),
    questionBody: l(
      'Nego harga, aturan DP, dan ketersediaan tanggal diurus langsung lewat WhatsApp bersama admin kami.',
      'Rates, deposit terms, and date availability are all handled directly over WhatsApp with our admin.',
    ),
  },
  contact: {
    address: l(
      'Kp. Kamojang, Desa Laksana, Kec. Ibun, Kab. Bandung, Jawa Barat',
      'Kp. Kamojang, Laksana Village, Ibun District, Bandung Regency, West Java',
    ),
    mapsQuery: MAPS_QUERY,
    footerTagline: l(
      'Destinasi wisata kawah geothermal, pemandian air panas & glamping di Kamojang, Jawa Barat.',
      'Geothermal crater tourism, hot springs & glamping in Kamojang, West Java.',
    ),
    waMessages: {
      general: l(
        'Halo D’Glorious Crater, saya ingin bertanya tentang penginapan.',
        'Hello D’Glorious Crater, I would like to ask about lodging.',
      ),
      booking: l(
        'Halo D’Glorious Crater, saya ingin bertanya soal reservasi penginapan.',
        'Hello D’Glorious Crater, I would like to ask about a lodging reservation.',
      ),
      room: l(
        'Halo D’Glorious Crater, saya ingin tanya ketersediaan & booking untuk {room}.',
        'Hello D’Glorious Crater, I would like to ask about availability and booking for {room}.',
      ),
      terms: l(
        'Halo D’Glorious Crater, saya ingin bertanya tentang syarat & ketentuan reservasi.',
        'Hello D’Glorious Crater, I would like to ask about the reservation terms & conditions.',
      ),
    },
  },
  site_meta: {
    description: l(
      'Kawah panas bumi, pemandian air panas alami, dan glamping di ketinggian berkabut perbatasan Bandung–Garut. Reservasi lewat WhatsApp.',
      'Geothermal crater, natural hot spring pools, and glamping in the misty highlands on the Bandung–Garut border. Reserve via WhatsApp.',
    ),
  },
};

// ─────────────────────────────────────────────────────────────
// Koleksi
// ─────────────────────────────────────────────────────────────
type Seed = { imageUrl?: string; content: Record<string, unknown> };

const attraction = (
  icon: string,
  photo: string,
  name: L,
  desc: L,
  featured: boolean,
): Seed => ({
  imageUrl: `${IMG}${photo}.jpg`,
  content: { name, desc, icon, featured },
});

const COLLECTIONS: Record<ContentCollection, Seed[]> = {
  ATTRACTION: [
    attraction(
      'Flame',
      'attraction-kawah',
      l('Kawah Geothermal', 'Geothermal Crater'),
      l(
        'Saksikan uap belerang mengepul dari perut bumi di salah satu ladang panas bumi tertua Indonesia.',
        "Watch sulfur steam rise from the earth at one of Indonesia's oldest geothermal fields.",
      ),
      true,
    ),
    attraction(
      'WavesLadder',
      'attraction-air-panas',
      l('Nirwana Pool', 'Nirwana Pool'),
      l(
        'Akses kolam eksklusif dengan pemandangan lembah, tersedia lewat paket Eksklusif atau Wisman — pengalaman berendam yang lebih privat dan tenang.',
        'Exclusive pool access with a valley view, available through the Eksklusif or Wisman package — a more private and serene soaking experience.',
      ),
      true,
    ),
    attraction(
      'Landmark',
      'location-valley',
      l('Glory Bridge', 'Glory Bridge'),
      l(
        'Jembatan gantung yang menyeberangi lembah. Ada satu lagi di sisi hutan, namanya Jungle Bridge.',
        'A suspension bridge across the valley. There is a second one on the forest side, called Jungle Bridge.',
      ),
      true,
    ),
    attraction(
      'Bath',
      'hero-crater',
      l('Kolam Berendam (Kawah Hujan)', 'Kawah Hujan Soaking Pool'),
      l(
        'Kolam berendam alami yang termasuk dalam paket dasar kunjungan — cara paling terjangkau untuk merasakan hangatnya air panas Kamojang.',
        "A natural soaking pool included in the basic visit package — the most affordable way to experience Kamojang's warm waters.",
      ),
      true,
    ),
    attraction(
      'Droplets',
      'room-glamping',
      l('Jacuzzi Private', 'Private Jacuzzi'),
      l(
        'Kamar rendam privat dengan jacuzzi, pilihan lain di paket Eksklusif untuk yang ingin berendam tanpa keramaian.',
        'A private soaking room with a jacuzzi — an alternative in the Eksklusif package for those who prefer to soak away from the crowd.',
      ),
      false,
    ),
    attraction(
      'Tent',
      'attraction-glamping',
      l('Glamping Mewah', 'Luxury Glamping'),
      l(
        'Menginap ditemani bintang dan kabut, dengan kenyamanan setara hotel di tengah alam.',
        'Stay under the stars and mist, with hotel-grade comfort in the middle of nature.',
      ),
      false,
    ),
    attraction(
      'Coffee',
      'attraction-kopi',
      l('Kopi & Kabut', 'Coffee & Mist'),
      l(
        'Nikmati kopi robusta khas dataran tinggi sambil memandang lanskap berkabut yang syahdu.',
        'Enjoy highland robusta coffee while gazing over a serene, misty landscape.',
      ),
      false,
    ),
    attraction(
      'Footprints',
      'room-tenda',
      l('Jungle Track', 'Jungle Track'),
      l(
        'Jalur setapak menembus hutan, menghubungkan sisi kawah dengan area tenda.',
        'A footpath through the forest, linking the crater side to the tent area.',
      ),
      false,
    ),
  ],

  INFO_CARD: [
    {
      content: {
        icon: 'Clock',
        title: l('Jam Buka', 'Opening Hours'),
        line1: l('Sen–Jum 08.00–22.00', 'Mon–Fri 08:00–22:00'),
        line2: l('Sab–Min 24 Jam', 'Sat–Sun 24 Hours'),
      },
    },
    {
      content: {
        icon: 'Ticket',
        title: l('Tiket Masuk', 'Entry Ticket'),
        line1: l('mulai Rp25.000', 'from Rp25,000'),
        line2: l('/orang', '/person'),
        linkLabel: l('Lihat paket', 'See packages'),
        href: '/tentang#tiket',
      },
    },
    {
      content: {
        icon: 'MapPin',
        title: l('Lokasi', 'Location'),
        line1: l('Kamojang, perbatasan', 'Kamojang, on the border'),
        line2: l('Bandung – Garut', 'of Bandung – Garut'),
      },
    },
    {
      content: {
        icon: 'Thermometer',
        title: l('Suhu', 'Temperature'),
        line1: l('Sejuk 16–22°C', 'Cool 16–22°C'),
        line2: l('bawa jaket ya', 'bring a jacket'),
      },
    },
  ],

  ROUTE: [
    {
      content: {
        from: l('Dari Kota Bandung', 'From Bandung city'),
        duration: l('±1 jam 30 menit', '±1 hr 30 min'),
        distance: l('±40 km', '±40 km'),
        note: l(
          'Lewat Majalaya–Ibun. Jalur ini paling pendek, tapi sebagian aspalnya bergelombang — santai saja, jangan diburu-buru.',
          'Via Majalaya–Ibun. This is the shortest way in, though parts of the asphalt are rough — take it slowly.',
        ),
      },
    },
    {
      content: {
        from: l('Dari Kota Garut', 'From Garut city'),
        duration: l('±1 jam', '±1 hr'),
        distance: l('±25 km', '±25 km'),
        note: l(
          'Lewat Samarang. Jaraknya lebih jauh dari jalur Majalaya, tapi jalannya sudah teraspal baik dan lebih nyaman untuk mobil rendah.',
          'Via Samarang. Longer than the Majalaya route but properly surfaced, and easier on a low-clearance car.',
        ),
      },
    },
  ],

  FAQ: [
    {
      content: {
        q: l('Bagaimana cara memesan penginapan?', 'How do I book a stay?'),
        a: l(
          'Hubungi admin lewat WhatsApp untuk mengecek ketersediaan tanggal dan menyepakati harga. Setelah deal, bayar DP 50% lewat transfer bank, lalu kirimkan foto bukti transfernya ke nomor WhatsApp yang sama. Belum ada pemesanan otomatis di situs ini — semuanya lewat admin.',
          'Message our admin on WhatsApp to check date availability and agree on a rate. Once settled, pay a 50% deposit by bank transfer and send the transfer receipt to that same WhatsApp number. There is no self-service booking on this site yet — every reservation goes through an admin.',
        ),
      },
    },
    {
      content: {
        q: l(
          'Berapa DP-nya, dan sampai kapan berlaku?',
          'How much is the deposit, and how long does it hold?',
        ),
        a: l(
          'DP 50% dari total, paling lambat 1×24 jam setelah kesepakatan. Lewat dari itu, tanggal yang kamu pesan otomatis dilepas kembali dan bisa diambil tamu lain.',
          'A 50% deposit, due within 24 hours of agreeing. After that window the dates are released automatically and another guest can take them.',
        ),
      },
    },
    {
      content: {
        q: l(
          'Kalau batal atau ingin pindah tanggal?',
          'What if I cancel or need to move dates?',
        ),
        a: l(
          'Pembatalan setelah pembayaran tidak bisa direfund — dananya hangus. Tapi pindah tanggal masih bisa, asalkan dikonfirmasi paling lambat 7 hari sebelum tanggal check-in semula.',
          'Cancellations after payment are non-refundable. Moving your dates is still possible, as long as you confirm at least 7 days before the original check-in date.',
        ),
      },
    },
    {
      content: {
        q: l(
          'Jam berapa check-in dan check-out?',
          'What are the check-in and check-out times?',
        ),
        a: l(
          'Check-in mulai pukul 14.00, check-out pukul 12.00. Early check-in dan late check-out tidak bisa dilayani karena unitnya perlu disiapkan untuk tamu berikutnya.',
          'Check-in from 2 PM, check-out at 12 PM. Early check-in and late check-out are not available — each unit needs turnaround time for the next guest.',
        ),
      },
    },
    {
      content: {
        q: l(
          'Anak-anak dihitung sebagai satu orang?',
          'Do children count toward capacity?',
        ),
        a: l(
          'Anak umur 6 tahun ke atas dihitung sebagai satu orang dewasa. Di bawah 5 tahun belum dihitung. Kalau rombonganmu melebihi kapasitas unit, bisa tambah extra bed atau charge person — tapi biasanya lebih nyaman dan lebih murah kalau langsung ambil tipe yang lebih besar atau menambah tenda.',
          'Children aged 6 and over count as one adult each; under-5s are not counted. If your group exceeds a unit’s capacity you can add an extra bed or pay a per-person charge — though it is usually more comfortable and cheaper to take a larger unit or add a second tent.',
        ),
      },
    },
    {
      content: {
        q: l('Boleh membawa hewan peliharaan?', 'Can I bring a pet?'),
        a: l(
          'Belum bisa. Hewan peliharaan tidak diperkenankan selama menginap.',
          'Not at this time. Pets are not permitted during your stay.',
        ),
      },
    },
    {
      content: {
        q: l('Sedingin apa di sana?', 'How cold does it get?'),
        a: l(
          'Di ketinggian sekitar 1.500 mdpl, suhunya berkisar 16–22°C dan turun lagi selepas magrib. Bawa jaket, kaus kaki, dan alas kaki yang nyaman untuk jalanan berbatu — kabut sering turun pagi dan sore.',
          'At roughly 1,500 m the air sits between 16–22°C and drops further after sunset. Bring a jacket, socks, and footwear you can walk rocky paths in — mist rolls in most mornings and late afternoons.',
        ),
      },
    },
  ],

  TICKET_PACKAGE: [
    {
      content: {
        name: l('Basic (Diamond)', 'Basic (Diamond)'),
        benefits: [
          l('Asuransi', 'Insurance'),
          l('Akses wisata DGCK', 'DGCK tourist area access'),
          l(
            'Akses kolam berendam (Kawah Hujan)',
            'Kawah Hujan soaking pool access',
          ),
        ],
        priceDay: 40000,
        priceNight: 25000,
      },
    },
    {
      content: {
        name: l('Eksklusif (Platinum)', 'Eksklusif (Platinum)'),
        benefits: [
          l('Semua benefit paket Basic', 'All Basic package benefits'),
          l('Welcome drink', 'Welcome drink'),
          l(
            'Pilih satu: Nirwana Pool, kamar rendam private (jacuzzi), atau jasa fotografer',
            'Choose one: Nirwana Pool, private jacuzzi room, or photographer service',
          ),
        ],
        priceDay: 55000,
        priceNight: 55000,
      },
    },
    {
      content: {
        name: l('Wisman', 'Foreign Visitor'),
        note: l('Khusus wisatawan mancanegara', 'Foreign tourists only'),
        benefits: [
          l('Welcome drink', 'Welcome drink'),
          l(
            'Exclusive pool (Nirwana Pool) atau hot tub private (jacuzzi)',
            'Exclusive pool (Nirwana Pool) or private hot tub (jacuzzi)',
          ),
        ],
        priceDay: 210000,
        priceNight: 210000,
      },
    },
    {
      content: {
        name: l('Anak 5–10 Tahun (Silver)', 'Children 5–10 (Silver)'),
        benefits: [
          l('Menggunakan ketentuan paket Silver', 'Uses Silver package terms'),
        ],
        priceDay: 30000,
        priceNight: 20000,
      },
    },
  ],

  PARKING_FEE: [
    { content: { vehicle: l('Bus', 'Bus'), price: 60000 } },
    { content: { vehicle: l('Mobil', 'Car'), price: 15000 } },
    { content: { vehicle: l('Motor', 'Motorcycle'), price: 5000 } },
    { content: { vehicle: l('Sepeda', 'Bicycle'), price: 2000 } },
  ],

  GALLERY: [
    {
      imageUrl: `${IMG}hero-crater.jpg`,
      content: { label: l('Panorama kawah', 'Crater panorama') },
    },
    {
      imageUrl: `${IMG}attraction-air-panas.jpg`,
      content: { label: l('Kolam air panas', 'Hot-spring pool') },
    },
    {
      imageUrl: `${IMG}room-glamping.jpg`,
      content: { label: l('Interior glamping', 'Glamping interior') },
    },
    {
      imageUrl: `${IMG}attraction-glamping.jpg`,
      content: {
        label: l('Glamping di antara pinus', 'Glamping among the pines'),
      },
    },
    {
      imageUrl: `${IMG}room-cottage.jpg`,
      content: { label: l('Kabin kayu', 'Wooden cabin') },
    },
    {
      imageUrl: `${IMG}location-valley.jpg`,
      content: { label: l('Lembah berkabut', 'Misty valley') },
    },
  ],

  FACILITY_ZONE: [
    {
      content: {
        icon: 'Flame',
        name: l('Kawah', 'Craters'),
        note: l(
          'Kawah-kawah dengan nama sendiri-sendiri, semuanya di dalam satu kawasan.',
          'Separately named craters, all inside the same grounds.',
        ),
        items: [
          l('Kawah Kamojang'),
          l('Kawah Manuk'),
          l('Kawah Berecek'),
          l('Kawah Kereta Api'),
        ],
      },
    },
    {
      content: {
        icon: 'WavesLadder',
        name: l('Air panas', 'Hot water'),
        note: l(
          'Beberapa cara berendam, dari kolam terbuka sampai kamar tertutup.',
          'Several ways to soak, from an open pool to a private room.',
        ),
        items: [
          l('Kolam Berendam Air Panas Alami', 'Natural Hot Spring Pool'),
          l(
            'Kolam Bundar dan Resto (Nirwana Pool)',
            'Round Pool & Resto (Nirwana Pool)',
          ),
          l(
            'Kamar Berendam Private (Jacuzzi)',
            'Private Soaking Room (Jacuzzi)',
          ),
          l('Sauna Alami (Kawah Hujan)', 'Natural Sauna (Kawah Hujan)'),
        ],
      },
    },
    {
      content: {
        icon: 'Landmark',
        name: l('Jembatan & jalur', 'Bridges & trails'),
        note: l(
          'Jembatan dan jalur hutan yang menghubungkan sisi-sisi kawasan.',
          'Bridges and a forest trail linking the far sides of the grounds.',
        ),
        items: [
          l(
            'Jembatan Gantung (Glory Bridge)',
            'Suspension Bridge (Glory Bridge)',
          ),
          l(
            'Jembatan Gantung (Jungle Bridge)',
            'Suspension Bridge (Jungle Bridge)',
          ),
          l(
            'Miniatur Jembatan Kuning (Crater Bridge)',
            'Yellow Bridge Replica (Crater Bridge)',
          ),
          l('Jungle Track'),
        ],
      },
    },
    {
      content: {
        icon: 'Tent',
        name: l('Menginap', 'Staying over'),
        note: l(
          'Tenda dan glamping di dalam kawasan, dalam beberapa tipe unit.',
          'Tents and glamping on the grounds, across several unit types.',
        ),
        items: [l('Camp Tent dan Glamping', 'Camp Tent & Glamping')],
      },
    },
    {
      content: {
        icon: 'ConciergeBell',
        name: l('Fasilitas umum', 'General facilities'),
        note: l(
          'Yang dipakai semua pengunjung, menginap maupun tidak.',
          'Used by every visitor, whether staying the night or not.',
        ),
        items: [
          l('Area Parkir Luas', 'Large Parking Area'),
          l('Amphiteater', 'Amphitheatre'),
          l('Billiard'),
          l('Mushola', 'Prayer Room'),
          l('Playground Area'),
          l('Restaurant dan Cafe', 'Restaurant & Cafe'),
          l(
            'Spot Foto Alam dan Kawah Lainnya',
            'Other Nature & Crater Photo Spots',
          ),
        ],
      },
    },
  ],
};

async function main() {
  const force = process.argv.includes('--force');

  // Validasi pakai validator yang sama dengan API supaya seed tidak bisa
  // menyimpan bentuk yang nanti ditolak saat diedit admin.
  const cleanSections: Record<string, object> = {};
  for (const [key, content] of Object.entries(SECTIONS)) {
    const schema = SECTION_SCHEMAS[key];
    if (!schema) throw new Error(`Section tidak dikenal di seed: ${key}`);
    cleanSections[key] = schema(content, '') as object;
  }
  for (const key of Object.keys(SECTION_SCHEMAS)) {
    if (!(key in SECTIONS))
      throw new Error(`Seed belum memuat section: ${key}`);
  }

  console.log(
    `Seed konten situs${force ? ' (--force: timpa semua section)' : ''}`,
  );

  for (const [key, content] of Object.entries(cleanSections)) {
    const existing = await prisma.siteSection.findUnique({ where: { key } });
    if (existing && !force) {
      console.log(`  section ${key.padEnd(24)} sudah ada, dilewati`);
      continue;
    }
    await prisma.siteSection.upsert({
      where: { key },
      create: { key, content },
      update: { content },
    });
    console.log(
      `  section ${key.padEnd(24)} ${existing ? 'ditimpa' : 'dibuat'}`,
    );
  }

  for (const collection of Object.keys(COLLECTIONS) as ContentCollection[]) {
    const count = await prisma.contentItem.count({ where: { collection } });
    if (count > 0) {
      console.log(
        `  koleksi ${collection.padEnd(16)} sudah berisi ${count}, dilewati`,
      );
      continue;
    }
    const items = COLLECTIONS[collection];
    for (const [index, item] of items.entries()) {
      const content = COLLECTION_SCHEMAS[collection](
        item.content,
        '',
      ) as object;
      await prisma.contentItem.create({
        data: {
          collection,
          sortOrder: index,
          imageUrl: item.imageUrl ?? null,
          content,
        },
      });
    }
    console.log(
      `  koleksi ${collection.padEnd(16)} diisi ${items.length} item`,
    );
  }

  const [sections, items] = await Promise.all([
    prisma.siteSection.count(),
    prisma.contentItem.count(),
  ]);
  console.log(`Selesai. Total: ${sections} section, ${items} item.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
