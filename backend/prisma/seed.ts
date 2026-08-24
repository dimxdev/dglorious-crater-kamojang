import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  RoleName,
  BookingSource,
  BookingStatus,
  BookingChannel,
  ExtraBedType,
} from '../src/generated/prisma/enums';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Password default untuk semua akun dummy (fase KP). Ganti di produksi.
const DEFAULT_PASSWORD = 'password123';

// ─────────────────────────────────────────────────────────────
// Data roles + user (1 user per role aktif)
// ─────────────────────────────────────────────────────────────
const ROLES: {
  name: RoleName;
  // Sengaja BUKAN `Record<string, unknown>`: `unknown` gak bisa masuk ke tipe
  // JSON-nya Prisma (`InputJsonValue`), jadi `tsc` nolak. Dipersempit ke bentuk
  // yang emang dipakai di bawah.
  permissions: Record<string, boolean | string[]>;
  user: { name: string; email: string };
}[] = [
  {
    name: RoleName.SUPER_ADMIN,
    permissions: { all: true },
    user: { name: 'Super Admin', email: 'superadmin@dglorious.com' },
  },
  {
    name: RoleName.OWNER,
    permissions: { dashboards: ['owner', 'penginapan', 'portal', 'cafe'], crud: true },
    user: { name: "Owner D'Glorious", email: 'owner@dglorious.com' },
  },
  {
    name: RoleName.ADMIN_PENGINAPAN,
    permissions: { dashboards: ['penginapan'], crud: true },
    user: { name: 'Admin Penginapan', email: 'admin.penginapan@dglorious.com' },
  },
];

// ─────────────────────────────────────────────────────────────
// Konfigurasi global (§8.3 PROJECT.md) — JANGAN hardcode di kode,
// admin bisa ubah lewat /admin/settings nanti.
// ─────────────────────────────────────────────────────────────
// 12 poin S&K RESMI dari klien (form reservasi WhatsApp D'Glorious Crater
// Kamojang, dikonfirmasi 2026-07-26) — sama persis dengan yang sudah dipakai
// `frontend/lib/data/settings.ts`. Menggantikan draft generik lama yang malah
// kontradiktif ("tidak ada sistem DP") dengan model bisnis fase 1 yang
// sebenarnya (DP 50%, lihat PROJECT.md §6.1).
//
// `Setting.value` cuma satu string per key (bukan per-bahasa) — jadi teks
// bilingual disimpan sebagai 2 KEY TERPISAH (`_id`/`_en`), bukan 1 kolom
// tambahan di skema. Pragmatis: `settings` itu key-value flat, beda kasus
// dari `room_type_translations` yang memang tabel relasional (aturan
// "jangan name_id/name_en" di §9 PROJECT.md soal itu, bukan soal ini).
const TERMS_ID = [
  '1. Melakukan pembayaran Down Payment 50% paling lambat 1x24 jam setelah dealing.',
  '2. Lebih dari 1x24 jam, booking akan rilis otomatis oleh sistem ke tamu lain.',
  '3. FOTO bukti transfer silahkan dikirim ke nomor WhatsApp ini.',
  '4. Hanya melakukan pembayaran ke rekening yang diberikan oleh staff Reservasi.',
  '5. Apabila melakukan pembatalan setelah pembayaran, maka pembayaran akan hangus (tidak ada refund).',
  '6. Konfirmasi reschedule dapat dilakukan paling lambat 7 hari sebelum tanggal check-in semula.',
  '7. Jumlah orang lebih dari kapasitas tenda/room harus dengan tambahan ekstra bed atau charge person. Disarankan untuk ganti tipe tenda yang lebih besar atau menambah tenda.',
  '8. Anak umur 6 tahun keatas dihitung sama dengan 1 orang dewasa. Dan anak umur dibawah 5 tahun belum terhitung dewasa.',
  '9. Tidak diperkenankan membawa hewan peliharaan selama menginap.',
  '10. Mohon sertakan foto KTP orang bersangkutan yang melakukan reservasi.',
  '11. Waktu check-in jam 14.00 dan check-out jam 12.00. Tidak bisa melakukan early check-in dan late check-out karena ada tamu sebelum dan sesudahnya.',
  '12. Pembayaran via transfer ke Rekening BSI 7262292465 a/n KOPERASI ALAM LESTARI.',
].join('\n');

const TERMS_EN = [
  '1. Pay a 50% down payment no later than 1x24 hours after the deal is agreed.',
  '2. After 1x24 hours, the booking is automatically released by the system to other guests.',
  '3. Please send a photo of the transfer receipt to this WhatsApp number.',
  '4. Only make payment to the account provided by the Reservation staff.',
  '5. If you cancel after payment, the payment is forfeited (no refund).',
  '6. Reschedule confirmation must be done no later than 7 days before the original check-in date.',
  '7. Guests exceeding tent/room capacity require an extra bed or extra-person charge. We recommend switching to a larger tent type or adding another tent.',
  '8. Children aged 6 and above are counted as 1 adult. Children under 5 are not counted as an adult.',
  '9. Pets are not allowed during the stay.',
  '10. Please include a photo of the ID card (KTP) of the person making the reservation.',
  '11. Check-in time is 14:00 and check-out is 12:00. Early check-in and late check-out are not possible due to other guests before and after.',
  '12. Payment via transfer to BSI Account 7262292465 a/n KOPERASI ALAM LESTARI.',
].join('\n');

// Kontak di bawah diambil dari spanduk resmi di lokasi (foto, 2026-08-18) —
// nomor reservasi, akun Instagram, email, dan domain yang tercetak di sana.
// Nomor WA sebelumnya `6282112345678` cuma placeholder seed, dan halaman
// publik memakainya untuk SEMUA tombol reservasi — jadi tiap CTA di situs
// mengarah ke nomor yang tidak ada.
const SETTINGS: { key: string; value: string }[] = [
  { key: 'check_in_time', value: '14:00' },
  { key: 'check_out_time', value: '12:00' },
  { key: 'whatsapp_number', value: '6281110003016' },
  { key: 'whatsapp_number_2', value: '6281111121171' },
  { key: 'contact_email', value: 'dgloriouscraterkamojang@gmail.com' },
  { key: 'instagram_url', value: 'https://www.instagram.com/dgloriouscraterkamojang' },
  { key: 'tiktok_url', value: 'https://www.tiktok.com/@dgloriouscraterkamojang' },
  { key: 'facebook_url', value: 'https://www.facebook.com/people/DGlorious-Crater-Kamojang/61554424100148/' },
  { key: 'bank_account', value: 'BSI 7262292465 a/n KOPERASI ALAM LESTARI' },
  { key: 'terms_conditions_id', value: TERMS_ID },
  { key: 'terms_conditions_en', value: TERMS_EN },
];

// ─────────────────────────────────────────────────────────────
// Data 6 tenda/villa ASLI — sumber: "Pricelist Penginapan DGCK" (PDF resmi
// klien), disamakan dengan `frontend/lib/data/rooms.ts` supaya mock frontend &
// isi database gak beda. Harga/kapasitas/tarif tambah orang SUDAH final dari
// klien; `totalUnits` masih ESTIMASI (belum dikonfirmasi, lihat PROJECT.md §11)
// dan URL gambar masih placeholder sampai foto asli tiap unit dikirim klien.
// ─────────────────────────────────────────────────────────────
const ROOM_TYPES = [
  {
    slug: 'eagle-hill',
    priceWeekday: 1999000,
    priceWeekend: 2499000,
    capacity: 2,
    totalUnits: 3,
    extraBedPrice: 300000,
    extraNoBedPrice: 200000,
    extraFlatPrice: null,
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
    unitPrefix: 'EH',
    images: ['https://picsum.photos/seed/eagle-hill-1/1200/800', 'https://picsum.photos/seed/eagle-hill-2/1200/800'],
    translations: {
      ID: {
        name: 'Eagle Hill',
        category: 'Cottage',
        tagline: 'Cottage privat dengan kolam air panas sendiri',
        description:
          'Cottage kayu nyaman dengan private hot spring di teras, kasur queen empuk, dan pemandangan hutan berkabut. Dilengkapi Smart TV & Netflix, mini bar, serta pemanas ruangan untuk malam yang sejuk di Kamojang.',
        bedInfo: '1 Queen Bed',
        bathroomInfo: 'Kamar mandi privat + private hot spring',
        facilitiesText: 'Sarapan, penghangat ruangan, Smart TV & Netflix, Wi-Fi, water heater, mini bar',
        rules: 'Check-in 14.00 WIB, check-out 12.00 WIB. Kelebihan tamu dikenakan tarif tambah orang.',
      },
      EN: {
        name: 'Eagle Hill',
        category: 'Cottage',
        tagline: 'Private cottage with your own hot spring',
        description:
          "A cozy wooden cottage with a private hot spring on the terrace, a plush queen bed, and misty forest views. Complete with Smart TV & Netflix, a mini bar, and a room heater for Kamojang's cool nights.",
        bedInfo: '1 Queen Bed',
        bathroomInfo: 'Private bathroom + private hot spring',
        facilitiesText: 'Breakfast, room heater, Smart TV & Netflix, Wi-Fi, water heater, mini bar',
        rules: 'Check-in 2 PM, check-out 12 PM. Extra guests are charged an additional person rate.',
      },
    },
  },
  {
    slug: 'royal-kahuripan',
    priceWeekday: 1000000,
    priceWeekend: 1200000,
    capacity: 2,
    totalUnits: 4,
    extraBedPrice: 300000,
    extraNoBedPrice: 200000,
    extraFlatPrice: null,
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
    unitPrefix: 'RK',
    images: ['https://picsum.photos/seed/royal-kahuripan-1/1200/800', 'https://picsum.photos/seed/royal-kahuripan-2/1200/800'],
    translations: {
      ID: {
        name: 'Royal Kahuripan',
        category: 'Glamping',
        tagline: 'Glamping nyaman ala hotel bintang',
        description:
          'Tenda glamping dengan kasur queen empuk, kamar mandi privat berair panas, dan fasilitas selengkap kamar hotel — TV digital, mini bar, hingga meja santai di depan tenda.',
        bedInfo: '1 Queen Bed',
        bathroomInfo: 'Kamar mandi privat',
        facilitiesText: 'Sarapan, penghangat ruangan, TV digital, Wi-Fi, water heater, mini bar',
        rules: 'Check-in 14.00 WIB, check-out 12.00 WIB. Kelebihan tamu dikenakan tarif tambah orang.',
      },
      EN: {
        name: 'Royal Kahuripan',
        category: 'Glamping',
        tagline: 'Hotel-comfort glamping',
        description:
          'A glamping tent with a plush queen bed, a private hot-water bathroom, and amenities as complete as a hotel room — digital TV, a mini bar, and a lounge table right outside the tent.',
        bedInfo: '1 Queen Bed',
        bathroomInfo: 'Private bathroom',
        facilitiesText: 'Breakfast, room heater, digital TV, Wi-Fi, water heater, mini bar',
        rules: 'Check-in 2 PM, check-out 12 PM. Extra guests are charged an additional person rate.',
      },
    },
  },
  {
    slug: 'camp-jamuju',
    priceWeekday: 1200000,
    priceWeekend: 1500000,
    capacity: 4,
    totalUnits: 5,
    extraBedPrice: 250000,
    extraNoBedPrice: 175000,
    extraFlatPrice: null,
    facilities: [
      { icon: 'UtensilsCrossed', label: { id: 'Sarapan', en: 'Breakfast' } },
      { icon: 'Flame', label: { id: 'Kayu Bakar & Bonfire (Bersama)', en: 'Firewood & Bonfire (Shared)' } },
      { icon: 'Trees', label: { id: 'Area Halaman Samping', en: 'Side Yard Area' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
      { icon: 'Armchair', label: { id: 'Meja & Kursi Santai', en: 'Lounge Table & Chairs' } },
      { icon: 'Coffee', label: { id: 'Coffee Corner', en: 'Coffee Corner' } },
    ],
    unitPrefix: 'CJ',
    images: ['https://picsum.photos/seed/camp-jamuju-1/1200/800', 'https://picsum.photos/seed/camp-jamuju-2/1200/800'],
    translations: {
      ID: {
        name: 'Camp Jamuju',
        category: 'Tenda',
        tagline: 'Tenda keluarga dengan halaman luas',
        description:
          'Tenda kanvas untuk 4 orang dengan area halaman samping yang lega, api unggun bersama, dan coffee corner untuk menghangatkan badan sebelum tidur.',
        bedInfo: '4 Single Bed',
        bathroomInfo: 'Kamar mandi bersama (air panas)',
        facilitiesText: 'Sarapan, api unggun bersama, coffee corner, Wi-Fi, air panas',
        rules: 'Check-in 14.00 WIB, check-out 12.00 WIB. Kelebihan tamu dikenakan tarif tambah orang.',
      },
      EN: {
        name: 'Camp Jamuju',
        category: 'Tent',
        tagline: 'Family tent with a spacious yard',
        description:
          'A canvas tent for 4, with a spacious side yard, a shared bonfire, and a coffee corner to warm up before sleep.',
        bedInfo: '4 Single Beds',
        bathroomInfo: 'Shared bathroom (hot water)',
        facilitiesText: 'Breakfast, shared bonfire, coffee corner, Wi-Fi, hot water',
        rules: 'Check-in 2 PM, check-out 12 PM. Extra guests are charged an additional person rate.',
      },
    },
  },
  {
    slug: 'camp-rasamala',
    priceWeekday: 800000,
    priceWeekend: 950000,
    capacity: 4,
    totalUnits: 4,
    extraBedPrice: 250000,
    extraNoBedPrice: 175000,
    extraFlatPrice: null,
    facilities: [
      { icon: 'UtensilsCrossed', label: { id: 'Sarapan', en: 'Breakfast' } },
      { icon: 'Flame', label: { id: 'Kayu Bakar & Bonfire Private', en: 'Firewood & Private Bonfire' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
      { icon: 'Armchair', label: { id: 'Meja & Kursi Santai', en: 'Lounge Table & Chairs' } },
      { icon: 'Coffee', label: { id: 'Coffee Corner', en: 'Coffee Corner' } },
    ],
    unitPrefix: 'CR',
    images: ['https://picsum.photos/seed/camp-rasamala-1/1200/800', 'https://picsum.photos/seed/camp-rasamala-2/1200/800'],
    translations: {
      ID: {
        name: 'Camp Rasamala',
        category: 'Tenda',
        tagline: 'Tenda dengan api unggun privat',
        description:
          'Tenda kanvas untuk 4 orang dengan bonfire privat sendiri — cocok untuk keluarga atau rombongan yang ingin bersantai di api unggun tanpa berbagi dengan tamu lain.',
        bedInfo: '4 Single Bed',
        bathroomInfo: 'Kamar mandi bersama (air panas)',
        facilitiesText: 'Sarapan, api unggun privat, coffee corner, Wi-Fi, air panas',
        rules: 'Check-in 14.00 WIB, check-out 12.00 WIB. Kelebihan tamu dikenakan tarif tambah orang.',
      },
      EN: {
        name: 'Camp Rasamala',
        category: 'Tent',
        tagline: 'Tent with a private bonfire',
        description:
          'A canvas tent for 4, with your own private bonfire — ideal for families or groups who want to unwind by the fire without sharing with other guests.',
        bedInfo: '4 Single Beds',
        bathroomInfo: 'Shared bathroom (hot water)',
        facilitiesText: 'Breakfast, private bonfire, coffee corner, Wi-Fi, hot water',
        rules: 'Check-in 2 PM, check-out 12 PM. Extra guests are charged an additional person rate.',
      },
    },
  },
  {
    slug: 'camp-cakrawala',
    priceWeekday: 600000,
    priceWeekend: 725000,
    capacity: 3,
    totalUnits: 6,
    extraBedPrice: 250000,
    extraNoBedPrice: 175000,
    extraFlatPrice: null,
    facilities: [
      { icon: 'UtensilsCrossed', label: { id: 'Sarapan', en: 'Breakfast' } },
      { icon: 'Flame', label: { id: 'Kayu Bakar & Bonfire (Bersama)', en: 'Firewood & Bonfire (Shared)' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
      { icon: 'Armchair', label: { id: 'Meja & Kursi Santai', en: 'Lounge Table & Chairs' } },
      { icon: 'Coffee', label: { id: 'Coffee Corner', en: 'Coffee Corner' } },
    ],
    unitPrefix: 'CC',
    images: ['https://picsum.photos/seed/camp-cakrawala-1/1200/800', 'https://picsum.photos/seed/camp-cakrawala-2/1200/800'],
    translations: {
      ID: {
        name: 'Camp Cakrawala',
        category: 'Tenda',
        tagline: 'Tenda ringkas untuk berdua-tiga',
        description:
          'Tenda kanvas ringkas untuk 3 orang, pilihan pas untuk yang datang berdua atau bertiga dan ingin merasakan berkemah santai tanpa ribet.',
        bedInfo: '2 Single Bed',
        bathroomInfo: 'Kamar mandi bersama (air panas)',
        facilitiesText: 'Sarapan, coffee corner, Wi-Fi, air panas',
        rules: 'Check-in 14.00 WIB, check-out 12.00 WIB. Kelebihan tamu dikenakan tarif tambah orang.',
      },
      EN: {
        name: 'Camp Cakrawala',
        category: 'Tent',
        tagline: 'Compact tent for two or three',
        description:
          'A compact canvas tent for 3, a great fit for couples or small groups who want a relaxed camping experience without the hassle.',
        bedInfo: '2 Single Beds',
        bathroomInfo: 'Shared bathroom (hot water)',
        facilitiesText: 'Breakfast, coffee corner, Wi-Fi, hot water',
        rules: 'Check-in 2 PM, check-out 12 PM. Extra guests are charged an additional person rate.',
      },
    },
  },
  {
    slug: 'glorious-campervan',
    priceWeekday: 350000,
    priceWeekend: 400000,
    capacity: 4,
    totalUnits: 8,
    // Campervan beda sendiri: tarif tambah orang FLAT, tidak kenal opsi
    // dengan/tanpa kasur (lihat `extraBedRate` di frontend/lib/pricing.ts).
    extraBedPrice: null,
    extraNoBedPrice: null,
    extraFlatPrice: 55000,
    facilities: [
      { icon: 'Flame', label: { id: 'Kayu Bakar & Bonfire (Bersama)', en: 'Firewood & Bonfire (Shared)' } },
      { icon: 'Plug', label: { id: 'Sumber Listrik', en: 'Power Source' } },
      { icon: 'Coffee', label: { id: 'Coffee Corner', en: 'Coffee Corner' } },
      { icon: 'Wifi', label: { id: 'Free Wi-Fi', en: 'Free Wi-Fi' } },
    ],
    unitPrefix: 'GC',
    images: ['https://picsum.photos/seed/glorious-campervan-1/1200/800', 'https://picsum.photos/seed/glorious-campervan-2/1200/800'],
    translations: {
      ID: {
        name: 'Glorious Campervan',
        category: 'Area Camping',
        tagline: 'Bawa mobil & tendamu sendiri',
        description:
          'Kavling terbuka 5×7 meter untuk campervan atau tenda pribadimu sendiri, lengkap dengan sumber listrik, coffee corner, dan akses ke semua fasilitas umum DGCK.',
        bedInfo: 'Kavling 5×7 Meter',
        bathroomInfo: 'Kamar mandi bersama',
        facilitiesText: 'Sumber listrik, coffee corner, Wi-Fi, kamar mandi bersama',
        rules: 'Check-in 14.00 WIB, check-out 12.00 WIB. Tambah orang dikenakan tarif flat per orang.',
      },
      EN: {
        name: 'Glorious Campervan',
        category: 'Camping Area',
        tagline: 'Bring your own car & tent',
        description:
          'An open 5×7 m plot for your own campervan or tent, complete with a power source, a coffee corner, and access to all DGCK common facilities.',
        bedInfo: '5×7 m Plot',
        bathroomInfo: 'Shared bathroom',
        facilitiesText: 'Power source, coffee corner, Wi-Fi, shared bathroom',
        rules: 'Check-in 2 PM, check-out 12 PM. Extra guests are charged a flat per-person rate.',
      },
    },
  },
];

async function seedRolesAndUsers() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const r of ROLES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { permissions: r.permissions },
      create: { name: r.name, permissions: r.permissions },
    });

    await prisma.user.upsert({
      where: { email: r.user.email },
      update: { name: r.user.name, roleId: role.id },
      create: {
        name: r.user.name,
        email: r.user.email,
        password: passwordHash,
        roleId: role.id,
      },
    });
  }
  console.log(`✔ Seeded ${ROLES.length} roles + ${ROLES.length} users`);
}

async function seedSettings() {
  for (const s of SETTINGS) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value },
    });
  }
  // Old single-language key, replaced by terms_conditions_id/_en above —
  // remove it so a re-seed (not a full reset) doesn't leave stale data.
  await prisma.setting.deleteMany({ where: { key: 'terms_conditions' } });
  console.log(`✔ Seeded ${SETTINGS.length} settings`);
}

async function seedRoomTypes(createdById: number) {
  for (const rt of ROOM_TYPES) {
    const pricing = {
      priceWeekday: rt.priceWeekday,
      priceWeekend: rt.priceWeekend,
      capacity: rt.capacity,
      totalUnits: rt.totalUnits,
      extraBedPrice: rt.extraBedPrice,
      extraNoBedPrice: rt.extraNoBedPrice,
      extraFlatPrice: rt.extraFlatPrice,
      facilities: rt.facilities,
    };
    const roomType = await prisma.roomType.upsert({
      where: { slug: rt.slug },
      update: pricing,
      create: { slug: rt.slug, ...pricing, createdById },
    });

    // Translations (ID wajib, EN diisi fase 1; ZH menyusul fase berikutnya)
    for (const [lang, t] of Object.entries(rt.translations)) {
      await prisma.roomTypeTranslation.upsert({
        where: {
          roomTypeId_languageCode: {
            roomTypeId: roomType.id,
            languageCode: lang as 'ID' | 'EN' | 'ZH',
          },
        },
        update: t,
        create: {
          roomTypeId: roomType.id,
          languageCode: lang as 'ID' | 'EN' | 'ZH',
          ...t,
        },
      });
    }

    // Unit fisik (unit_code unik per tipe)
    for (let i = 1; i <= rt.totalUnits; i++) {
      const unitCode = `${rt.unitPrefix}-${String(i).padStart(2, '0')}`;
      await prisma.roomUnit.upsert({
        where: { roomTypeId_unitCode: { roomTypeId: roomType.id, unitCode } },
        update: {},
        create: { roomTypeId: roomType.id, unitCode },
      });
    }

    // Gambar (reset lalu buat ulang — tidak ada unique alami)
    await prisma.roomImage.deleteMany({ where: { roomTypeId: roomType.id } });
    await prisma.roomImage.createMany({
      data: rt.images.map((url, idx) => ({
        roomTypeId: roomType.id,
        imageUrl: url,
        isCover: idx === 0,
        sortOrder: idx,
      })),
    });
  }
  console.log(`✔ Seeded ${ROOM_TYPES.length} room types (+ translations, units, images)`);
}

/**
 * Contoh booking dummy — sengaja 2 baris supaya dua jalur pencatatan yang
 * beda kelihatan: WhatsApp (tamu belum tiba, masih DP, `createdAt` beberapa
 * hari sebelum check-in) & Walk-in (tamu langsung datang, sudah lunas &
 * CHECKED_IN, `createdAt` = tanggal check-in). Yang WhatsApp juga multi-tenda
 * + extra bed, buat membuktikan `booking_items` & tarif tambah orang.
 */
async function seedSampleBookings(createdById: number) {
  const eagleHill = await prisma.roomType.findUniqueOrThrow({ where: { slug: 'eagle-hill' } });
  const royal = await prisma.roomType.findUniqueOrThrow({ where: { slug: 'royal-kahuripan' } });
  const jamuju = await prisma.roomType.findUniqueOrThrow({ where: { slug: 'camp-jamuju' } });

  // ── 1. Jalur WhatsApp: multi-tenda, masih DP, tamu belum tiba ──
  const nights = 2;
  const eagleSubtotal = Number(eagleHill.priceWeekday) * nights;
  const royalSubtotal = Number(royal.priceWeekday) * nights;
  const extraBedQty = 1;
  // Pakai tarif "dengan kasur tambahan" milik tipe tenda-nya, bukan angka karangan.
  const extraBedPrice = Number(eagleHill.extraBedPrice ?? 0);
  const waTotal = eagleSubtotal + royalSubtotal + extraBedQty * extraBedPrice * nights;

  const waCode = 'DGC-SEED01';
  if (!(await prisma.booking.findUnique({ where: { bookingCode: waCode } }))) {
    await prisma.booking.create({
      data: {
        bookingCode: waCode,
        guestName: 'Budi Santoso',
        guestPhone: '081234567890',
        createdAt: new Date('2026-07-24'), // dicatat 8 hari sebelum check-in
        checkIn: new Date('2026-08-01'),
        checkOut: new Date('2026-08-03'),
        priceSnapshot: waTotal,
        isPriceOverride: false,
        status: BookingStatus.DP,
        bookingChannel: BookingChannel.WHATSAPP,
        bookingSource: BookingSource.MANUAL,
        notes: 'Contoh booking dummy — multi-tenda + extra bed, masih DP.',
        createdById,
        // Dewasa/anak/extra-bed per tenda (§8.2) — Eagle Hill dapat extra
        // bed (2 dewasa + 1 tambahan), Royal Kahuripan pasangan + 1 anak.
        items: {
          create: [
            {
              roomTypeId: eagleHill.id,
              qty: 1,
              subtotalSnapshot: eagleSubtotal,
              adults: 2,
              children: 0,
              extraBedQty,
              extraBedType: ExtraBedType.WITH_BED,
              extraBedPrice,
            },
            {
              roomTypeId: royal.id,
              qty: 1,
              subtotalSnapshot: royalSubtotal,
              adults: 1,
              children: 1,
            },
          ],
        },
      },
    });
  }

  // ── 2. Jalur Walk-in: langsung lunas & check-in di hari yang sama ──
  const walkinCode = 'DGC-SEED02';
  if (!(await prisma.booking.findUnique({ where: { bookingCode: walkinCode } }))) {
    const walkinSubtotal = Number(jamuju.priceWeekday) * 1;
    const checkInDate = new Date('2026-07-26');
    await prisma.booking.create({
      data: {
        bookingCode: walkinCode,
        guestName: 'Citra Lestari',
        guestPhone: '082177881122',
        createdAt: checkInDate, // walk-in: dicatat persis saat tamu datang
        checkIn: checkInDate,
        checkOut: new Date('2026-07-27'),
        priceSnapshot: walkinSubtotal,
        status: BookingStatus.CHECKED_IN,
        bookingChannel: BookingChannel.WALK_IN,
        bookingSource: BookingSource.MANUAL,
        notes: 'Contoh booking dummy — tamu langsung, lunas & check-in seketika.',
        createdById,
        lunasAt: checkInDate,
        checkedInAt: checkInDate,
        items: {
          create: [
            { roomTypeId: jamuju.id, qty: 1, subtotalSnapshot: walkinSubtotal, adults: 4, children: 0 },
          ],
        },
      },
    });
  }

  console.log('✔ Seeded 2 sample bookings (WhatsApp multi-tenda + Walk-in)');
}

async function main() {
  await seedRolesAndUsers();
  await seedSettings();

  const superAdmin = await prisma.user.findUniqueOrThrow({
    where: { email: 'superadmin@dglorious.com' },
  });
  await seedRoomTypes(superAdmin.id);
  await seedSampleBookings(superAdmin.id);

  console.log('\n🌱 Seed selesai.');
  console.log(`   Login dummy — password semua akun: "${DEFAULT_PASSWORD}"`);
  for (const r of ROLES) {
    console.log(`   - ${r.name.padEnd(18)} → ${r.user.email}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed gagal:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
