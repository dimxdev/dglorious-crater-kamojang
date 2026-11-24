/**
 * Data demo NOVEMBER 2026 untuk presentasi ke dosen pembimbing.
 * Hanya menambah reservasi bulan November (tidak menghapus data lain).
 * Semua tamu demo memakai nomor +628133300xxxx; menjalankan ulang skrip ini
 * menghapus reservasi bernomor itu dulu, jadi aman diulang.
 * Jalankan: npx tsx prisma/seed-november.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  ReservationStatus,
  ReservationChannel,
  ExtraBedType,
  PaymentMethod,
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

type EditSpec = { at: string; note: string; changes: Record<string, { from: unknown; to: unknown }> };

type ReservationSpec = {
  guestName: string;
  guestPhone: string;
  channel: 'RESERVASI' | 'LANGSUNG';
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
  edits?: EditSpec[];
};

const SPECS: ReservationSpec[] = [
  // ── Sudah lewat (1–12 Nov) ──
  { guestName: 'Rizky Pratama', guestPhone: '+6281333000001', channel: 'RESERVASI', targetStatus: 'COMPLETED', checkIn: '2026-11-01', checkOut: '2026-11-02', createdAt: '2026-10-27', lunasAt: '2026-10-30', items: [{ slug: 'eagle-hill', adults: 2 }] },
  { guestName: 'Nadia Safitri', guestPhone: '+6281333000002', channel: 'LANGSUNG', targetStatus: 'COMPLETED', checkIn: '2026-11-01', checkOut: '2026-11-02', createdAt: '2026-11-01', items: [{ slug: 'glorious-campervan', adults: 2, children: 1 }] },
  { guestName: 'Keluarga Suryadi', guestPhone: '+6281333000003', channel: 'RESERVASI', targetStatus: 'COMPLETED', checkIn: '2026-11-03', checkOut: '2026-11-05', createdAt: '2026-10-28', lunasAt: '2026-11-01', items: [{ slug: 'camp-jamuju', adults: 4, children: 2, extraBedQty: 1, extraBedType: 'WITH_BED' }], notes: 'Keluarga dengan 2 anak, tambah 1 extra bed' },
  { guestName: 'Arif Hidayat', guestPhone: '+6281333000004', channel: 'RESERVASI', targetStatus: 'NO_SHOW', checkIn: '2026-11-04', checkOut: '2026-11-05', createdAt: '2026-10-30', lunasAt: '2026-11-02', items: [{ slug: 'royal-kahuripan', adults: 2 }], notes: 'Sudah lunas tetapi tamu tidak datang' },
  { guestName: 'Laras Ayuningtyas', guestPhone: '+6281333000005', channel: 'RESERVASI', targetStatus: 'HANGUS_AUTO', checkIn: '2026-11-06', checkOut: '2026-11-08', createdAt: '2026-11-01', items: [{ slug: 'camp-rasamala', adults: 3 }], notes: 'DP masuk, tidak dilunasi sampai lewat tanggal' },
  { guestName: 'Komunitas Pecinta Alam Bandung', guestPhone: '+6281333000006', channel: 'RESERVASI', targetStatus: 'COMPLETED', checkIn: '2026-11-07', checkOut: '2026-11-09', createdAt: '2026-10-20', lunasAt: '2026-11-03', items: [{ slug: 'camp-cakrawala', adults: 2 }, { slug: 'camp-cakrawala', adults: 2 }, { slug: 'camp-cakrawala', adults: 3 }, { slug: 'camp-rasamala', adults: 3 }], overrideTotal: 4500000, notes: 'Rombongan 4 unit, harga paket hasil negosiasi' },
  { guestName: 'Yoga Permana', guestPhone: '+6281333000007', channel: 'LANGSUNG', targetStatus: 'COMPLETED', checkIn: '2026-11-07', checkOut: '2026-11-08', createdAt: '2026-11-07', items: [{ slug: 'eagle-hill', adults: 2, extraBedQty: 1, extraBedType: 'WITHOUT_BED' }] },
  { guestName: 'Melati Kusuma', guestPhone: '+6281333000008', channel: 'RESERVASI', targetStatus: 'HANGUS_MANUAL', checkIn: '2026-11-08', checkOut: '2026-11-10', createdAt: '2026-11-02', hangusAt: '2026-11-05', items: [{ slug: 'royal-kahuripan', adults: 2 }], notes: 'Tamu membatalkan, DP hangus sesuai ketentuan' },
  { guestName: 'Dimas Anggara', guestPhone: '+6281333000009', channel: 'RESERVASI', targetStatus: 'COMPLETED', checkIn: '2026-11-09', checkOut: '2026-11-11', createdAt: '2026-11-02', lunasAt: '2026-11-07', items: [{ slug: 'camp-jamuju', adults: 3 }], discount: 150000, notes: 'Diskon pelanggan lama',
    edits: [{ at: '2026-11-04T09:15:00+07:00', note: 'Tamu minta jadwal mundur satu hari', changes: { checkIn: { from: '2026-11-08', to: '2026-11-09' }, checkOut: { from: '2026-11-10', to: '2026-11-11' } } }] },
  { guestName: 'Siti Rohmah', guestPhone: '+6281333000010', channel: 'LANGSUNG', targetStatus: 'COMPLETED', checkIn: '2026-11-10', checkOut: '2026-11-11', createdAt: '2026-11-10', items: [{ slug: 'camp-cakrawala', adults: 2 }] },
  { guestName: 'Bayu Nugroho', guestPhone: '+6281333000011', channel: 'RESERVASI', targetStatus: 'COMPLETED', checkIn: '2026-11-11', checkOut: '2026-11-12', createdAt: '2026-11-06', lunasAt: '2026-11-10', items: [{ slug: 'glorious-campervan', adults: 3 }, { slug: 'glorious-campervan', adults: 2 }] },

  // ── Hari ini 13 Nov ──
  { guestName: 'Rina Marlina', guestPhone: '+6281333000012', channel: 'RESERVASI', targetStatus: 'CHECKED_IN', checkIn: '2026-11-12', checkOut: '2026-11-14', createdAt: '2026-11-05', lunasAt: '2026-11-10', items: [{ slug: 'eagle-hill', adults: 2 }], notes: 'Sedang menginap' },
  { guestName: 'Galih Saputra', guestPhone: '+6281333000013', channel: 'LANGSUNG', targetStatus: 'CHECKED_IN', checkIn: '2026-11-13', checkOut: '2026-11-15', createdAt: '2026-11-13', items: [{ slug: 'camp-rasamala', adults: 3, extraBedQty: 1, extraBedType: 'WITH_BED' }], notes: 'Langsung hari ini' },
  { guestName: 'Hana Pertiwi', guestPhone: '+6281333000014', channel: 'RESERVASI', targetStatus: 'LUNAS', checkIn: '2026-11-13', checkOut: '2026-11-15', createdAt: '2026-11-03', lunasAt: '2026-11-09', items: [{ slug: 'royal-kahuripan', adults: 2, children: 1 }], notes: 'Lunas, dijadwalkan tiba hari ini (siap check-in)' },
  { guestName: 'Fajar Ramdani', guestPhone: '+6281333000015', channel: 'RESERVASI', targetStatus: 'DP', checkIn: '2026-11-14', checkOut: '2026-11-16', createdAt: '2026-11-08', items: [{ slug: 'camp-jamuju', adults: 4 }], notes: 'Tiba besok, sisa pembayaran belum masuk' },

  // ── Akan datang (14–30 Nov) ──
  { guestName: 'Putra Wijaya', guestPhone: '+6281333000016', channel: 'RESERVASI', targetStatus: 'LUNAS', checkIn: '2026-11-14', checkOut: '2026-11-15', createdAt: '2026-11-04', lunasAt: '2026-11-11', items: [{ slug: 'camp-cakrawala', adults: 2 }, { slug: 'glorious-campervan', adults: 2 }], notes: 'Multi-tipe: Cakrawala + Campervan' },
  { guestName: 'Sekar Arum', guestPhone: '+6281333000017', channel: 'RESERVASI', targetStatus: 'DP', checkIn: '2026-11-18', checkOut: '2026-11-26', createdAt: '2026-11-12', items: [{ slug: 'camp-rasamala', adults: 2 }] },
  // Eagle Hill penuh (3 dari 3 unit) pada malam 21 Nov
  { guestName: 'Ahmad Fauzi', guestPhone: '+6281333000018', channel: 'RESERVASI', targetStatus: 'LUNAS', checkIn: '2026-11-20', checkOut: '2026-11-22', createdAt: '2026-10-25', lunasAt: '2026-11-06', items: [{ slug: 'eagle-hill', adults: 2 }] },
  { guestName: 'Citra Maharani', guestPhone: '+6281333000019', channel: 'RESERVASI', targetStatus: 'DP', checkIn: '2026-11-21', checkOut: '2026-11-22', createdAt: '2026-11-07', items: [{ slug: 'eagle-hill', adults: 2, extraBedQty: 1, extraBedType: 'WITH_BED' }] },
  { guestName: 'Reza Firmansyah', guestPhone: '+6281333000020', channel: 'RESERVASI', targetStatus: 'DP', checkIn: '2026-11-21', checkOut: '2026-11-23', createdAt: '2026-11-10', items: [{ slug: 'eagle-hill', adults: 2 }], discount: 100000,
    edits: [{ at: '2026-11-11T14:30:00+07:00', note: 'Koreksi nomor WhatsApp dan beri diskon promo', changes: { guestPhone: { from: '+6281333000099', to: '+6281333000020' }, discount: { from: 0, to: 100000 } } }] },
  { guestName: 'SMA Negeri 3 Garut (Study Tour)', guestPhone: '+6281333000021', channel: 'RESERVASI', targetStatus: 'LUNAS', checkIn: '2026-11-21', checkOut: '2026-11-22', createdAt: '2026-10-15', lunasAt: '2026-11-12', items: [{ slug: 'glorious-campervan', adults: 4 }, { slug: 'glorious-campervan', adults: 4 }, { slug: 'glorious-campervan', adults: 4 }, { slug: 'glorious-campervan', adults: 4 }, { slug: 'camp-cakrawala', adults: 2 }], overrideTotal: 2200000, notes: 'Rombongan sekolah, harga paket' },
  { guestName: 'Wulan Sari', guestPhone: '+6281333000022', channel: 'RESERVASI', targetStatus: 'DP', checkIn: '2026-11-25', checkOut: '2026-11-27', createdAt: '2026-11-12', items: [{ slug: 'royal-kahuripan', adults: 2 }, { slug: 'royal-kahuripan', adults: 2 }] },
  { guestName: 'Teguh Santoso', guestPhone: '+6281333000023', channel: 'RESERVASI', targetStatus: 'LUNAS', checkIn: '2026-11-27', checkOut: '2026-11-29', createdAt: '2026-11-01', lunasAt: '2026-11-13', items: [{ slug: 'camp-jamuju', adults: 3, children: 2, extraBedQty: 1, extraBedType: 'WITHOUT_BED' }] },
  { guestName: 'PT Sinar Kamojang (Family Gathering)', guestPhone: '+6281333000024', channel: 'RESERVASI', targetStatus: 'DP', checkIn: '2026-11-28', checkOut: '2026-11-30', createdAt: '2026-11-09', items: [{ slug: 'camp-jamuju', adults: 4 }, { slug: 'camp-jamuju', adults: 4 }, { slug: 'camp-rasamala', adults: 3 }, { slug: 'camp-rasamala', adults: 3 }, { slug: 'eagle-hill', adults: 2 }], discount: 500000, notes: 'Rombongan perusahaan 5 unit, diskon korporat' },
  { guestName: 'Intan Nuraini', guestPhone: '+6281333000025', channel: 'RESERVASI', targetStatus: 'DP', checkIn: '2026-11-29', checkOut: '2026-11-30', createdAt: '2026-11-13', items: [{ slug: 'camp-cakrawala', adults: 2 }] },
];

async function main() {
  const deleted = await prisma.reservation.deleteMany({ where: { OR: [{ guestPhone: { startsWith: '+628133300' } }, { guestPhone: { startsWith: '08133300' } }] } });
  console.log(`reservasi demo November lama dihapus: ${deleted.count}`);

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
    let storedStatus: ReservationStatus;
    let lunasAt: Date | null = spec.lunasAt ? new Date(spec.lunasAt) : null;
    let checkedInAt: Date | null = null;
    let hangusAt: Date | null = spec.hangusAt ? new Date(spec.hangusAt) : null;

    switch (spec.targetStatus) {
      case 'DP':
        storedStatus = ReservationStatus.DP;
        lunasAt = null;
        break;
      case 'LUNAS':
        storedStatus = ReservationStatus.LUNAS;
        break;
      case 'CHECKED_IN':
      case 'COMPLETED': // COMPLETED = CHECKED_IN + checkOut sudah lewat (dihitung otomatis)
        storedStatus = ReservationStatus.CHECKED_IN;
        checkedInAt = checkIn;
        break;
      case 'NO_SHOW': // status DISIMPAN tetap LUNAS; NO_SHOW murni turunan (checkOut lewat, tak pernah check-in)
        storedStatus = ReservationStatus.LUNAS;
        break;
      case 'HANGUS_MANUAL':
        storedStatus = ReservationStatus.HANGUS;
        lunasAt = null;
        break;
      case 'HANGUS_AUTO': // status DISIMPAN tetap DP; HANGUS murni turunan (checkOut lewat, tak pernah lunas)
        storedStatus = ReservationStatus.DP;
        lunasAt = null;
        break;
    }

    const code = randCode();
    await prisma.reservation.create({
      data: {
        reservationCode: code,
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
        channel: ReservationChannel[spec.channel],
        notes: spec.notes,
        createdById: admin.id,
        lunasAt,
        checkedInAt,
        hangusAt,
        items: { create: itemRows },
      },
    });

    // ── Payment(s) — mengikuti pola nyata ReservationsService ──
    const paymentDates = { created: new Date(spec.createdAt), lunas: lunasAt, checkedIn: checkedInAt };
    if (spec.channel === 'LANGSUNG') {
      // Reservasi langsung selalu lunas penuh saat check-in.
      await prisma.payment.create({
        data: {
          reservationId: (await prisma.reservation.findUniqueOrThrow({ where: { reservationCode: code } })).id,
          method: [PaymentMethod.CASH, PaymentMethod.QRIS, PaymentMethod.BANK_TRANSFER][created % 3],
          amount: priceSnapshot,
          paidAt: paymentDates.checkedIn ?? paymentDates.created,
        },
      });
    } else if (spec.targetStatus === 'DP') {
      const dpAmount = Math.round(priceSnapshot * 0.5);
      await prisma.payment.create({
        data: {
          reservationId: (await prisma.reservation.findUniqueOrThrow({ where: { reservationCode: code } })).id,
          method: PaymentMethod.BANK_TRANSFER,
          amount: dpAmount,
          paidAt: paymentDates.created,
        },
      });
    } else if (spec.targetStatus === 'HANGUS_AUTO' || spec.targetStatus === 'HANGUS_MANUAL') {
      // DP yang sudah masuk sebelum reservation-nya batal — uangnya beneran diterima, cuma reservationnya gak jadi.
      const dpAmount = Math.round(priceSnapshot * 0.5);
      await prisma.payment.create({
        data: {
          reservationId: (await prisma.reservation.findUniqueOrThrow({ where: { reservationCode: code } })).id,
          method: PaymentMethod.BANK_TRANSFER,
          amount: dpAmount,
          paidAt: paymentDates.created,
        },
      });
    } else {
      // LUNAS / CHECKED_IN / COMPLETED / NO_SHOW via reservasi — 2 tahap: DP dulu, baru pelunasan.
      const reservationRow = await prisma.reservation.findUniqueOrThrow({ where: { reservationCode: code } });
      const dpAmount = Math.round(priceSnapshot * 0.5);
      await prisma.payment.create({
        data: {
          reservationId: reservationRow.id,
          method: PaymentMethod.BANK_TRANSFER,
          amount: dpAmount,
          paidAt: paymentDates.created,
        },
      });
      await prisma.payment.create({
        data: {
          reservationId: reservationRow.id,
          method: PaymentMethod.BANK_TRANSFER,
          amount: priceSnapshot - dpAmount,
          paidAt: paymentDates.lunas ?? paymentDates.created,
        },
      });
    }

    if (spec.edits) {
      const row = await prisma.reservation.findUniqueOrThrow({ where: { reservationCode: code } });
      for (const e of spec.edits) {
        await prisma.reservationEditLog.create({ data: { reservationId: row.id, editedById: admin.id, editedAt: new Date(e.at), note: e.note, changes: e.changes as object } });
      }
    }
    created++;
  }

  console.log(`✔ ${created} reservation demo baru dibuat (November 2026)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
