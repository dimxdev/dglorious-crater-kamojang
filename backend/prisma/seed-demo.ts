/**
 * Skrip SEKALI PAKAI untuk presentasi (2026-08-21) — kosongkan booking lama,
 * isi ulang dengan dataset yang mencakup SEMUA skenario fitur: 6 tipe tenda,
 * kedua channel (WhatsApp/Walk-in), semua status (DP/LUNAS/CHECKED_IN, plus
 * turunan COMPLETED/HANGUS/NO_SHOW), booking multi-tenda & rombongan, diskon,
 * dan override harga manual. Rentang tanggal Maret–September 2026 supaya
 * grafik tren 6 bulan Owner ada isinya dan ada juga booking "bulan depan"
 * (pipeline) untuk didemokan.
 *
 * BUKAN bagian dari `prisma db seed` standar (lihat `seed.ts`) — jalankan
 * manual: `npx tsx prisma/seed-demo.ts`. Aman dihapus setelah presentasi.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  BookingSource,
  BookingStatus,
  BookingChannel,
  ExtraBedType,
  PaymentMethod,
  PaymentStatus,
} from '../src/generated/prisma/enums';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // tanpa 0/O/1/I, sama seperti generator asli
function randCode(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return `DGC-${s}`;
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

type RoomTypeRow = {
  id: number;
  slug: string;
  priceWeekday: unknown;
  priceWeekend: unknown;
  extraBedPrice: unknown;
  extraNoBedPrice: unknown;
  extraFlatPrice: unknown;
};

function calcStayPrice(room: RoomTypeRow, checkIn: Date, checkOut: Date): number {
  let total = 0;
  const d = new Date(checkIn);
  while (d < checkOut) {
    total += isWeekend(d) ? Number(room.priceWeekend) : Number(room.priceWeekday);
    d.setDate(d.getDate() + 1);
  }
  return total;
}

function calcNights(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86400000);
}

function extraRate(room: RoomTypeRow, type?: 'WITH_BED' | 'WITHOUT_BED'): number {
  if (Number(room.extraFlatPrice ?? 0) > 0) return Number(room.extraFlatPrice);
  if (!type) return 0;
  return type === 'WITH_BED' ? Number(room.extraBedPrice ?? 0) : Number(room.extraNoBedPrice ?? 0);
}

type ItemSpec = {
  slug: string;
  adults: number;
  children?: number;
  extraBedQty?: number;
  extraBedType?: 'WITH_BED' | 'WITHOUT_BED';
};

type BookingSpec = {
  guestName: string;
  guestPhone: string;
  channel: 'WHATSAPP' | 'WALK_IN';
  /** Status akhir yang mau ditunjukkan — beberapa dihitung otomatis dari tanggal (§6.2), bukan disimpan langsung. */
  targetStatus: 'DP' | 'LUNAS' | 'CHECKED_IN' | 'COMPLETED' | 'HANGUS_MANUAL' | 'HANGUS_AUTO' | 'NO_SHOW';
  checkIn: string;
  checkOut: string;
  createdAt: string;
  lunasAt?: string;
  hangusAt?: string;
  items: ItemSpec[];
  discount?: number;
  overrideTotal?: number;
  notes?: string;
};

const SPECS: BookingSpec[] = [
  // ── Maret 2026 ──
  { guestName: 'Andi Wirawan', guestPhone: '081211110001', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-03-05', checkOut: '2026-03-07', createdAt: '2026-03-01', lunasAt: '2026-03-03', items: [{ slug: 'eagle-hill', adults: 2 }] },
  { guestName: 'Sri Wahyuni', guestPhone: '081211110002', channel: 'WALK_IN', targetStatus: 'COMPLETED', checkIn: '2026-03-14', checkOut: '2026-03-15', createdAt: '2026-03-14', items: [{ slug: 'camp-rasamala', adults: 3 }, { slug: 'camp-rasamala', adults: 3 }], notes: 'Rombongan 2 unit tipe sama' },
  { guestName: 'Bagas Prasetyo', guestPhone: '081211110003', channel: 'WHATSAPP', targetStatus: 'NO_SHOW', checkIn: '2026-03-20', checkOut: '2026-03-22', createdAt: '2026-03-15', lunasAt: '2026-03-17', items: [{ slug: 'royal-kahuripan', adults: 2 }] },

  // ── April 2026 ──
  { guestName: 'Dewi Kartika', guestPhone: '081211110004', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-04-03', checkOut: '2026-04-05', createdAt: '2026-03-28', lunasAt: '2026-03-30', items: [{ slug: 'camp-jamuju', adults: 3 }, { slug: 'camp-cakrawala', adults: 2 }], discount: 100000, notes: 'Multi-tipe: Jamuju + Cakrawala' },
  { guestName: 'Fahri Ramadhan', guestPhone: '081211110005', channel: 'WALK_IN', targetStatus: 'COMPLETED', checkIn: '2026-04-10', checkOut: '2026-04-11', createdAt: '2026-04-10', items: [{ slug: 'glorious-campervan', adults: 2 }] },
  { guestName: 'Gita Amelia', guestPhone: '081211110006', channel: 'WHATSAPP', targetStatus: 'HANGUS_MANUAL', checkIn: '2026-04-18', checkOut: '2026-04-20', createdAt: '2026-04-12', hangusAt: '2026-04-14', items: [{ slug: 'eagle-hill', adults: 2 }], notes: 'Dibatalkan tamu sebelum DP genap' },
  { guestName: 'Hendra Kusuma', guestPhone: '081211110007', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-04-25', checkOut: '2026-04-27', createdAt: '2026-04-20', lunasAt: '2026-04-22', items: [{ slug: 'camp-rasamala', adults: 3, extraBedQty: 1, extraBedType: 'WITH_BED' }] },

  // ── Mei 2026 ──
  { guestName: 'Intan Permatasari', guestPhone: '081211110008', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-05-02', checkOut: '2026-05-04', createdAt: '2026-04-27', lunasAt: '2026-04-29', items: [{ slug: 'royal-kahuripan', adults: 2, extraBedQty: 1, extraBedType: 'WITHOUT_BED' }] },
  { guestName: 'Joko Setiawan', guestPhone: '081211110009', channel: 'WALK_IN', targetStatus: 'COMPLETED', checkIn: '2026-05-09', checkOut: '2026-05-10', createdAt: '2026-05-09', items: [{ slug: 'camp-cakrawala', adults: 2 }] },
  { guestName: 'Kirana Sari', guestPhone: '081211110010', channel: 'WHATSAPP', targetStatus: 'HANGUS_AUTO', checkIn: '2026-05-14', checkOut: '2026-05-16', createdAt: '2026-05-10', items: [{ slug: 'eagle-hill', adults: 2 }], notes: 'DP masuk tapi tidak pernah dilunasi' },
  { guestName: 'PT Angkasa Jaya (Gathering Kantor)', guestPhone: '081211110011', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-05-20', checkOut: '2026-05-22', createdAt: '2026-05-15', lunasAt: '2026-05-17', items: [{ slug: 'camp-jamuju', adults: 4 }, { slug: 'camp-jamuju', adults: 4 }, { slug: 'camp-jamuju', adults: 3 }], overrideTotal: 6000000, notes: 'Rombongan 3 unit, harga nego (override)' },

  // ── Juni 2026 ──
  { guestName: 'Lukman Hakim', guestPhone: '081211110012', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-06-01', checkOut: '2026-06-02', createdAt: '2026-05-27', lunasAt: '2026-05-29', items: [{ slug: 'glorious-campervan', adults: 2 }] },
  { guestName: 'Mira Anjani', guestPhone: '081211110013', channel: 'WALK_IN', targetStatus: 'COMPLETED', checkIn: '2026-06-08', checkOut: '2026-06-10', createdAt: '2026-06-08', items: [{ slug: 'royal-kahuripan', adults: 2 }] },
  { guestName: 'Nanda Firmansyah', guestPhone: '081211110014', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-06-15', checkOut: '2026-06-17', createdAt: '2026-06-10', lunasAt: '2026-06-12', items: [{ slug: 'camp-rasamala', adults: 3 }, { slug: 'camp-cakrawala', adults: 2 }], discount: 50000 },
  { guestName: 'Oki Wardhana', guestPhone: '081211110015', channel: 'WHATSAPP', targetStatus: 'NO_SHOW', checkIn: '2026-06-22', checkOut: '2026-06-24', createdAt: '2026-06-18', lunasAt: '2026-06-19', items: [{ slug: 'eagle-hill', adults: 2 }] },

  // ── Juli 2026 ──
  { guestName: 'Putri Damayanti', guestPhone: '081211110016', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-07-03', checkOut: '2026-07-05', createdAt: '2026-06-28', lunasAt: '2026-06-30', items: [{ slug: 'camp-jamuju', adults: 3 }] },
  { guestName: 'Qori Anggraini', guestPhone: '081211110017', channel: 'WALK_IN', targetStatus: 'COMPLETED', checkIn: '2026-07-10', checkOut: '2026-07-11', createdAt: '2026-07-10', items: [{ slug: 'glorious-campervan', adults: 2 }, { slug: 'glorious-campervan', adults: 3 }], notes: 'Walk-in rombongan 2 unit' },
  { guestName: 'Rian Saputra', guestPhone: '081211110018', channel: 'WHATSAPP', targetStatus: 'HANGUS_MANUAL', checkIn: '2026-07-16', checkOut: '2026-07-18', createdAt: '2026-07-11', hangusAt: '2026-07-13', items: [{ slug: 'royal-kahuripan', adults: 2 }] },
  { guestName: 'Sinta Ayu Lestari', guestPhone: '081211110019', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-07-22', checkOut: '2026-07-25', createdAt: '2026-07-15', lunasAt: '2026-07-18', items: [{ slug: 'eagle-hill', adults: 2, extraBedQty: 1, extraBedType: 'WITH_BED' }, { slug: 'royal-kahuripan', adults: 2 }], notes: 'Multi-tipe: Eagle Hill + Royal Kahuripan' },
  { guestName: 'Taufik Ramadhan', guestPhone: '081211110020', channel: 'WALK_IN', targetStatus: 'COMPLETED', checkIn: '2026-07-28', checkOut: '2026-07-29', createdAt: '2026-07-28', items: [{ slug: 'camp-cakrawala', adults: 2 }] },

  // ── Agustus 2026 (bulan berjalan) ──
  { guestName: 'Umar Syahid', guestPhone: '081211110021', channel: 'WHATSAPP', targetStatus: 'COMPLETED', checkIn: '2026-08-02', checkOut: '2026-08-04', createdAt: '2026-07-28', lunasAt: '2026-07-30', items: [{ slug: 'camp-rasamala', adults: 3 }] },
  { guestName: 'Vina Kusumawardani', guestPhone: '081211110022', channel: 'WALK_IN', targetStatus: 'COMPLETED', checkIn: '2026-08-06', checkOut: '2026-08-07', createdAt: '2026-08-06', items: [{ slug: 'eagle-hill', adults: 2 }] },
  { guestName: 'Wisnu Aditya', guestPhone: '081211110023', channel: 'WHATSAPP', targetStatus: 'HANGUS_AUTO', checkIn: '2026-08-09', checkOut: '2026-08-11', createdAt: '2026-08-05', items: [{ slug: 'royal-kahuripan', adults: 2 }] },
  { guestName: 'Yulia Rahmawati', guestPhone: '081211110024', channel: 'WHATSAPP', targetStatus: 'NO_SHOW', checkIn: '2026-08-12', checkOut: '2026-08-14', createdAt: '2026-08-08', lunasAt: '2026-08-09', items: [{ slug: 'camp-jamuju', adults: 4 }] },
  { guestName: 'Zainal Abidin', guestPhone: '081211110025', channel: 'WALK_IN', targetStatus: 'COMPLETED', checkIn: '2026-08-15', checkOut: '2026-08-16', createdAt: '2026-08-15', items: [{ slug: 'glorious-campervan', adults: 2 }, { slug: 'camp-cakrawala', adults: 2 }], notes: 'Walk-in multi-tipe' },
  { guestName: 'Agus Salim', guestPhone: '081211110026', channel: 'WHATSAPP', targetStatus: 'CHECKED_IN', checkIn: '2026-08-19', checkOut: '2026-08-24', createdAt: '2026-08-14', lunasAt: '2026-08-16', items: [{ slug: 'eagle-hill', adults: 2 }], notes: 'Sedang menginap saat presentasi' },
  { guestName: 'Bunga Citra', guestPhone: '081211110027', channel: 'WALK_IN', targetStatus: 'CHECKED_IN', checkIn: '2026-08-20', checkOut: '2026-08-23', createdAt: '2026-08-20', items: [{ slug: 'royal-kahuripan', adults: 2 }, { slug: 'royal-kahuripan', adults: 2 }], notes: 'Rombongan sedang menginap' },
  { guestName: 'Chandra Wijaya', guestPhone: '081211110028', channel: 'WHATSAPP', targetStatus: 'LUNAS', checkIn: '2026-08-25', checkOut: '2026-08-27', createdAt: '2026-08-18', lunasAt: '2026-08-20', items: [{ slug: 'camp-rasamala', adults: 3 }], notes: 'Sudah lunas, belum tiba' },
  { guestName: 'Dian Puspitasari', guestPhone: '081211110029', channel: 'WHATSAPP', targetStatus: 'DP', checkIn: '2026-08-29', checkOut: '2026-08-31', createdAt: '2026-08-19', items: [{ slug: 'camp-jamuju', adults: 3 }, { slug: 'camp-cakrawala', adults: 2 }], discount: 75000, notes: 'DP masuk, tunggu pelunasan' },

  // ── September 2026 (bulan depan / pipeline) ──
  { guestName: 'Eka Nurhayati', guestPhone: '081211110030', channel: 'WHATSAPP', targetStatus: 'DP', checkIn: '2026-09-04', checkOut: '2026-09-06', createdAt: '2026-08-20', items: [{ slug: 'eagle-hill', adults: 2 }] },
  { guestName: 'Farhan Maulana', guestPhone: '081211110031', channel: 'WHATSAPP', targetStatus: 'LUNAS', checkIn: '2026-09-11', checkOut: '2026-09-13', createdAt: '2026-08-15', lunasAt: '2026-08-17', items: [{ slug: 'royal-kahuripan', adults: 2 }] },
  { guestName: 'Grup Karang Taruna RW 05', guestPhone: '081211110032', channel: 'WHATSAPP', targetStatus: 'DP', checkIn: '2026-09-18', checkOut: '2026-09-20', createdAt: '2026-08-19', items: [{ slug: 'glorious-campervan', adults: 4 }, { slug: 'glorious-campervan', adults: 4 }, { slug: 'glorious-campervan', adults: 3 }], notes: 'Rombongan besar 3 unit — pipeline bulan depan' },
  { guestName: 'Keluarga Besar Hartono', guestPhone: '081211110033', channel: 'WHATSAPP', targetStatus: 'LUNAS', checkIn: '2026-09-25', checkOut: '2026-09-28', createdAt: '2026-08-10', lunasAt: '2026-08-13', items: [{ slug: 'camp-cakrawala', adults: 2 }, { slug: 'camp-rasamala', adults: 3 }, { slug: 'camp-jamuju', adults: 4 }], overrideTotal: 9500000, notes: '3 tipe tenda sekaligus, harga nego rombongan besar' },
];

async function main() {
  console.log('Menghapus semua booking lama (payments/items/edit-logs ikut ter-cascade)...');
  const deleted = await prisma.booking.deleteMany({});
  console.log(`✔ ${deleted.count} booking lama dihapus`);

  const admin = await prisma.user.findFirst({
    where: { email: { in: ['admin.penginapan@dglorious.com', 'owner@dglorious.com'] } },
    orderBy: { email: 'asc' },
  });
  if (!admin) throw new Error('User admin.penginapan@dglorious.com belum ada — jalankan prisma db seed dulu.');

  const roomTypes = await prisma.roomType.findMany();
  const bySlug = new Map(roomTypes.map((r) => [r.slug, r as unknown as RoomTypeRow]));

  let created = 0;
  for (const spec of SPECS) {
    const checkIn = new Date(spec.checkIn);
    const checkOut = new Date(spec.checkOut);
    const nights = calcNights(checkIn, checkOut);

    const itemRows = spec.items.map((it) => {
      const room = bySlug.get(it.slug);
      if (!room) throw new Error(`Room type ${it.slug} tidak ditemukan`);
      const stay = calcStayPrice(room, checkIn, checkOut);
      const rate = it.extraBedQty ? extraRate(room, it.extraBedType) : 0;
      const subtotal = stay + (it.extraBedQty ?? 0) * rate * nights;
      return {
        roomTypeId: room.id,
        qty: 1,
        subtotalSnapshot: subtotal,
        adults: it.adults,
        children: it.children ?? 0,
        extraBedQty: it.extraBedQty ?? 0,
        extraBedType: it.extraBedType ? (ExtraBedType[it.extraBedType]) : undefined,
        extraBedPrice: rate,
      };
    });

    const autoTotal = itemRows.reduce((s, i) => s + i.subtotalSnapshot, 0);
    const discount = spec.discount ?? 0;
    const grossTotal = spec.overrideTotal ?? autoTotal;
    const priceSnapshot = Math.max(0, grossTotal - discount);

    // Petakan target status demo ke status yang benar-benar DISIMPAN (§6.2 —
    // COMPLETED/NO_SHOW/HANGUS-otomatis TIDAK disimpan, cuma dihitung dari
    // tanggal saat dibaca; yang disimpan cuma DP/LUNAS/CHECKED_IN/HANGUS).
    let storedStatus: BookingStatus;
    let lunasAt: Date | null = spec.lunasAt ? new Date(spec.lunasAt) : null;
    let checkedInAt: Date | null = null;
    let hangusAt: Date | null = spec.hangusAt ? new Date(spec.hangusAt) : null;

    switch (spec.targetStatus) {
      case 'DP':
        storedStatus = BookingStatus.DP;
        lunasAt = null;
        break;
      case 'LUNAS':
        storedStatus = BookingStatus.LUNAS;
        break;
      case 'CHECKED_IN':
      case 'COMPLETED': // COMPLETED = CHECKED_IN + checkOut sudah lewat (dihitung otomatis)
        storedStatus = BookingStatus.CHECKED_IN;
        checkedInAt = checkIn;
        break;
      case 'NO_SHOW': // status DISIMPAN tetap LUNAS; NO_SHOW murni turunan (checkOut lewat, tak pernah check-in)
        storedStatus = BookingStatus.LUNAS;
        break;
      case 'HANGUS_MANUAL':
        storedStatus = BookingStatus.HANGUS;
        lunasAt = null;
        break;
      case 'HANGUS_AUTO': // status DISIMPAN tetap DP; HANGUS murni turunan (checkOut lewat, tak pernah lunas)
        storedStatus = BookingStatus.DP;
        lunasAt = null;
        break;
    }

    const code = randCode();
    await prisma.booking.create({
      data: {
        bookingCode: code,
        guestName: spec.guestName,
        guestPhone: spec.guestPhone,
        createdAt: new Date(spec.createdAt),
        checkIn,
        checkOut,
        priceSnapshot,
        autoCalculatedTotal: autoTotal,
        isPriceOverride: spec.overrideTotal !== undefined,
        discount,
        status: storedStatus,
        bookingChannel: BookingChannel[spec.channel],
        bookingSource: BookingSource.MANUAL,
        notes: spec.notes,
        createdById: admin.id,
        lunasAt,
        checkedInAt,
        hangusAt,
        items: { create: itemRows },
      },
    });

    // ── Payment(s) — mengikuti pola nyata BookingsService ──
    const paymentDates = { created: new Date(spec.createdAt), lunas: lunasAt, checkedIn: checkedInAt };
    if (spec.channel === 'WALK_IN') {
      // Walk-in selalu langsung lunas penuh saat check-in.
      await prisma.payment.create({
        data: {
          bookingId: (await prisma.booking.findUniqueOrThrow({ where: { bookingCode: code } })).id,
          method: [PaymentMethod.CASH, PaymentMethod.QRIS, PaymentMethod.BANK_TRANSFER][created % 3],
          amount: priceSnapshot,
          status: PaymentStatus.PAID,
          paidAt: paymentDates.checkedIn ?? paymentDates.created,
        },
      });
    } else if (spec.targetStatus === 'DP') {
      const dpAmount = Math.round(priceSnapshot * 0.5);
      await prisma.payment.create({
        data: {
          bookingId: (await prisma.booking.findUniqueOrThrow({ where: { bookingCode: code } })).id,
          method: PaymentMethod.BANK_TRANSFER,
          amount: dpAmount,
          status: PaymentStatus.PAID,
          paidAt: paymentDates.created,
        },
      });
    } else if (spec.targetStatus === 'HANGUS_AUTO' || spec.targetStatus === 'HANGUS_MANUAL') {
      // DP yang sudah masuk sebelum booking-nya batal — uangnya beneran diterima, cuma bookingnya gak jadi.
      const dpAmount = Math.round(priceSnapshot * 0.5);
      await prisma.payment.create({
        data: {
          bookingId: (await prisma.booking.findUniqueOrThrow({ where: { bookingCode: code } })).id,
          method: PaymentMethod.BANK_TRANSFER,
          amount: dpAmount,
          status: PaymentStatus.PAID,
          paidAt: paymentDates.created,
        },
      });
    } else {
      // LUNAS / CHECKED_IN / COMPLETED / NO_SHOW via WhatsApp — 2 tahap: DP dulu, baru pelunasan.
      const bookingRow = await prisma.booking.findUniqueOrThrow({ where: { bookingCode: code } });
      const dpAmount = Math.round(priceSnapshot * 0.5);
      await prisma.payment.create({
        data: {
          bookingId: bookingRow.id,
          method: PaymentMethod.BANK_TRANSFER,
          amount: dpAmount,
          status: PaymentStatus.PAID,
          paidAt: paymentDates.created,
        },
      });
      await prisma.payment.create({
        data: {
          bookingId: bookingRow.id,
          method: PaymentMethod.BANK_TRANSFER,
          amount: priceSnapshot - dpAmount,
          status: PaymentStatus.PAID,
          paidAt: paymentDates.lunas ?? paymentDates.created,
        },
      });
    }

    created++;
  }

  console.log(`✔ ${created} booking demo baru dibuat (Maret–September 2026, semua skenario)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
