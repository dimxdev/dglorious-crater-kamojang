import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoleName, BookingSource, BookingStatus, BookingPaymentStatus } from '../src/generated/prisma/enums';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Password default untuk semua akun dummy (fase KP). Ganti di produksi.
const DEFAULT_PASSWORD = 'password123';

// ─────────────────────────────────────────────────────────────
// Data roles + user (1 user per role aktif)
// ─────────────────────────────────────────────────────────────
const ROLES: {
  name: RoleName;
  permissions: Record<string, unknown>;
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
const SETTINGS: { key: string; value: string }[] = [
  { key: 'check_in_time', value: '14:00' },
  { key: 'check_out_time', value: '12:00' },
  { key: 'whatsapp_number', value: '6282112345678' },
  { key: 'bank_account', value: 'BSI 7262292465 a/n KOPERASI ALAM LESTARI' },
  {
    key: 'terms_conditions',
    value: [
      '1. Booking dianggap sah setelah pembayaran lunas diterima.',
      '2. Check-in pukul 14.00 WIB, check-out pukul 12.00 WIB.',
      '3. Pembayaran dilakukan penuh (lunas) di muka, tidak ada sistem DP.',
      '4. Kode booking wajib ditunjukkan saat check-in.',
      '5. Pembatalan booking tidak dapat dikembalikan (no refund).',
      '6. Kerusakan fasilitas menjadi tanggung jawab tamu.',
      '7. Kapasitas tenda/villa wajib dipatuhi sesuai jumlah tamu efektif.',
      '8. Kelebihan tamu dari kapasitas dikenakan extra bed / charge person / ganti tipe unit yang lebih besar.',
      '9. Dilarang membawa hewan peliharaan tanpa izin.',
      '10. Dilarang merokok di dalam unit.',
      '11. Jam tenang mulai pukul 22.00 WIB.',
      '12. Reschedule tanggal paling lambat H-7 sebelum check-in.',
    ].join('\n'),
  },
];

// ─────────────────────────────────────────────────────────────
// Data dummy tenda/villa (nama & harga masih placeholder — §11 dikonfirmasi klien)
// ─────────────────────────────────────────────────────────────
const ROOM_TYPES = [
  {
    slug: 'glamping-deluxe',
    priceWeekday: 850000,
    priceWeekend: 1050000,
    capacity: 2,
    totalUnits: 5,
    facilities: ['wifi', 'ac', 'private_bathroom', 'hot_water', 'breakfast'],
    unitPrefix: 'GD',
    images: [
      'https://picsum.photos/seed/glamping-deluxe-1/1200/800',
      'https://picsum.photos/seed/glamping-deluxe-2/1200/800',
    ],
    translations: {
      ID: {
        name: 'Glamping Deluxe',
        description:
          'Tenda glamping mewah dengan pemandangan kawah geothermal, dilengkapi kasur nyaman dan kamar mandi air panas alami.',
        facilitiesText: 'WiFi, AC, kamar mandi dalam, air panas, sarapan',
        rules: 'Dilarang merokok di dalam tenda.',
      },
      EN: {
        name: 'Deluxe Glamping',
        description:
          'Luxury glamping tent overlooking the geothermal crater, with a cozy bed and natural hot spring bathroom.',
        facilitiesText: 'WiFi, AC, private bathroom, hot water, breakfast',
        rules: 'No smoking inside the tent.',
      },
    },
  },
  {
    slug: 'cottage-family',
    priceWeekday: 1500000,
    priceWeekend: 1800000,
    capacity: 4,
    totalUnits: 3,
    facilities: ['wifi', 'ac', 'private_bathroom', 'hot_water', 'breakfast', 'kitchen', 'living_room'],
    unitPrefix: 'CF',
    images: [
      'https://picsum.photos/seed/cottage-family-1/1200/800',
      'https://picsum.photos/seed/cottage-family-2/1200/800',
    ],
    translations: {
      ID: {
        name: 'Cottage Keluarga',
        description:
          'Cottage kayu luas untuk keluarga, dengan ruang tamu, dapur kecil, dan teras menghadap hutan.',
        facilitiesText: 'WiFi, AC, kamar mandi dalam, air panas, sarapan, dapur, ruang tamu',
        rules: 'Maksimal 4 tamu efektif per unit.',
      },
      EN: {
        name: 'Family Cottage',
        description:
          'Spacious wooden cottage for families, featuring a living room, kitchenette, and a terrace facing the forest.',
        facilitiesText: 'WiFi, AC, private bathroom, hot water, breakfast, kitchen, living room',
        rules: 'Maximum 4 effective guests per unit.',
      },
    },
  },
  {
    slug: 'tenda-standar',
    priceWeekday: 500000,
    priceWeekend: 650000,
    capacity: 2,
    totalUnits: 8,
    facilities: ['shared_bathroom', 'hot_water', 'breakfast'],
    unitPrefix: 'TS',
    images: ['https://picsum.photos/seed/tenda-standar-1/1200/800'],
    translations: {
      ID: {
        name: 'Tenda Standar',
        description:
          'Tenda nyaman dengan harga terjangkau, cocok untuk backpacker yang ingin merasakan udara pegunungan Kamojang.',
        facilitiesText: 'Kamar mandi bersama, air panas, sarapan',
        rules: 'Kamar mandi bersama.',
      },
      EN: {
        name: 'Standard Tent',
        description:
          'A comfortable, budget-friendly tent, perfect for backpackers who want to enjoy the Kamojang mountain air.',
        facilitiesText: 'Shared bathroom, hot water, breakfast',
        rules: 'Shared bathroom.',
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
  console.log(`✔ Seeded ${SETTINGS.length} settings`);
}

async function seedRoomTypes(createdById: number) {
  for (const rt of ROOM_TYPES) {
    const roomType = await prisma.roomType.upsert({
      where: { slug: rt.slug },
      update: {
        priceWeekday: rt.priceWeekday,
        priceWeekend: rt.priceWeekend,
        capacity: rt.capacity,
        totalUnits: rt.totalUnits,
        facilities: rt.facilities,
      },
      create: {
        slug: rt.slug,
        priceWeekday: rt.priceWeekday,
        priceWeekend: rt.priceWeekend,
        capacity: rt.capacity,
        totalUnits: rt.totalUnits,
        facilities: rt.facilities,
        createdById,
      },
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

/** Contoh booking dummy — membuktikan skema baru (multi-tenda, extra bed, payment status). */
async function seedSampleBooking(createdById: number) {
  const glamping = await prisma.roomType.findUniqueOrThrow({ where: { slug: 'glamping-deluxe' } });
  const cottage = await prisma.roomType.findUniqueOrThrow({ where: { slug: 'cottage-family' } });

  const nights = 2;
  const glampingSubtotal = Number(glamping.priceWeekday) * nights;
  const cottageSubtotal = Number(cottage.priceWeekday) * nights;
  const extraBedQty = 1;
  const extraBedPrice = 150000;
  const total = glampingSubtotal + cottageSubtotal + extraBedQty * extraBedPrice;

  const bookingCode = 'DGC-SEED01';
  const existing = await prisma.booking.findUnique({ where: { bookingCode } });
  if (existing) {
    console.log('✔ Sample booking sudah ada, lewati');
    return;
  }

  await prisma.booking.create({
    data: {
      bookingCode,
      guestName: 'Budi Santoso',
      guestPhone: '081234567890',
      adults: 3,
      children: 1,
      checkIn: new Date('2026-08-01'),
      checkOut: new Date('2026-08-03'),
      extraBedQty,
      extraBedPrice,
      priceSnapshot: total,
      isPriceOverride: false,
      status: BookingStatus.CONFIRMED,
      paymentStatus: BookingPaymentStatus.UNPAID,
      bookingSource: BookingSource.MANUAL,
      notes: 'Contoh booking dummy — membuktikan multi-tenda & extra bed.',
      createdById,
      confirmedAt: new Date(),
      items: {
        create: [
          { roomTypeId: glamping.id, qty: 1, subtotalSnapshot: glampingSubtotal },
          { roomTypeId: cottage.id, qty: 1, subtotalSnapshot: cottageSubtotal },
        ],
      },
    },
  });
  console.log('✔ Seeded 1 sample booking (multi-tenda + extra bed)');
}

async function main() {
  await seedRolesAndUsers();
  await seedSettings();

  const superAdmin = await prisma.user.findUniqueOrThrow({
    where: { email: 'superadmin@dglorious.com' },
  });
  await seedRoomTypes(superAdmin.id);
  await seedSampleBooking(superAdmin.id);

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
