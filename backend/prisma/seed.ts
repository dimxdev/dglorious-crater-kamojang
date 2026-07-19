import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { RoleName } from '../src/generated/prisma/enums';

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
// Data dummy penginapan (nama & harga masih placeholder — §11 dikonfirmasi klien)
// ─────────────────────────────────────────────────────────────
const ROOM_TYPES = [
  {
    slug: 'glamping-deluxe',
    pricePerNight: 850000,
    capacity: 2,
    totalUnits: 5,
    checkInTime: '14:00',
    checkOutTime: '12:00',
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
        rules: 'Check-in 14.00, check-out 12.00. Dilarang merokok di dalam tenda.',
      },
      EN: {
        name: 'Deluxe Glamping',
        description:
          'Luxury glamping tent overlooking the geothermal crater, with a cozy bed and natural hot spring bathroom.',
        facilitiesText: 'WiFi, AC, private bathroom, hot water, breakfast',
        rules: 'Check-in 2 PM, check-out 12 PM. No smoking inside the tent.',
      },
    },
  },
  {
    slug: 'cottage-family',
    pricePerNight: 1500000,
    capacity: 4,
    totalUnits: 3,
    checkInTime: '14:00',
    checkOutTime: '12:00',
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
        rules: 'Maksimal 4 tamu. Check-in 14.00, check-out 12.00.',
      },
      EN: {
        name: 'Family Cottage',
        description:
          'Spacious wooden cottage for families, featuring a living room, kitchenette, and a terrace facing the forest.',
        facilitiesText: 'WiFi, AC, private bathroom, hot water, breakfast, kitchen, living room',
        rules: 'Maximum 4 guests. Check-in 2 PM, check-out 12 PM.',
      },
    },
  },
  {
    slug: 'tenda-standar',
    pricePerNight: 500000,
    capacity: 2,
    totalUnits: 8,
    checkInTime: '14:00',
    checkOutTime: '12:00',
    facilities: ['shared_bathroom', 'hot_water', 'breakfast'],
    unitPrefix: 'TS',
    images: ['https://picsum.photos/seed/tenda-standar-1/1200/800'],
    translations: {
      ID: {
        name: 'Tenda Standar',
        description:
          'Tenda nyaman dengan harga terjangkau, cocok untuk backpacker yang ingin merasakan udara pegunungan Kamojang.',
        facilitiesText: 'Kamar mandi bersama, air panas, sarapan',
        rules: 'Check-in 14.00, check-out 12.00. Kamar mandi bersama.',
      },
      EN: {
        name: 'Standard Tent',
        description:
          'A comfortable, budget-friendly tent, perfect for backpackers who want to enjoy the Kamojang mountain air.',
        facilitiesText: 'Shared bathroom, hot water, breakfast',
        rules: 'Check-in 2 PM, check-out 12 PM. Shared bathroom.',
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

async function seedRoomTypes(createdById: number) {
  for (const rt of ROOM_TYPES) {
    const roomType = await prisma.roomType.upsert({
      where: { slug: rt.slug },
      update: {
        pricePerNight: rt.pricePerNight,
        capacity: rt.capacity,
        totalUnits: rt.totalUnits,
        checkInTime: rt.checkInTime,
        checkOutTime: rt.checkOutTime,
        facilities: rt.facilities,
      },
      create: {
        slug: rt.slug,
        pricePerNight: rt.pricePerNight,
        capacity: rt.capacity,
        totalUnits: rt.totalUnits,
        checkInTime: rt.checkInTime,
        checkOutTime: rt.checkOutTime,
        facilities: rt.facilities,
        createdById,
      },
    });

    // Translations (ID wajib, EN opsional)
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

async function main() {
  await seedRolesAndUsers();

  const superAdmin = await prisma.user.findUniqueOrThrow({
    where: { email: 'superadmin@dglorious.com' },
  });
  await seedRoomTypes(superAdmin.id);

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
