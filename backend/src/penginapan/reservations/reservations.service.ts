import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { Prisma } from '../../generated/prisma/client';
import {
  ReservationChannel,
  ReservationStatus,
  PaymentMethod,
} from '../../generated/prisma/enums';
import { isBeforeTodayWib, isTodayWib, todayWib } from '../../common/date-wib';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calcNights,
  calcStayPrice,
  extraBedRate,
} from '../room-types/pricing.util';
import { RoomTypesService } from '../room-types/room-types.service';
import {
  groupRequestedUnits,
  insufficientUnitsMessage,
  RequestedUnitItem,
} from './availability.util';
import {
  validateAdultCapacity,
  validateChildrenCapacity,
  validateDiscount,
  validateDownPayment,
  validateStayDates,
} from './stay-validation.util';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { EditReservationDto } from './dto/edit-reservation.dto';
import { UpdateReservationStatusDto } from './dto/update-reservation-status.dto';

// Alfabet tanpa 0/O/1/I — hindari salah baca pas admin dikte kode via telepon/WA.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const PAST_CHECKIN_MESSAGE = 'Tanggal check-in tidak boleh sebelum hari ini.';
const RESCHEDULE_MIN_DAYS = 7;
const RESCHEDULE_TOO_LATE_MESSAGE =
  'Reschedule hanya bisa dilakukan paling lambat 7 hari sebelum tanggal check-in semula (S&K poin 6).';
/** Selisih hari kalender antara dua tanggal 'YYYY-MM-DD' (to - from). */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}
const CHECKIN_TOO_EARLY_MESSAGE =
  'Belum bisa check-in sebelum tanggal check-in. Jika tamu datang lebih awal, ubah dulu tanggal check-in reservasi menjadi hari ini.';
const CHECKIN_TOO_LATE_MESSAGE =
  'Tanggal check-out sudah tiba atau lewat, reservasi ini tidak bisa di-check-in.';
const CHECKED_IN_DATE_LOCKED_MESSAGE =
  'Tanggal check-in tidak bisa diubah karena tamu sudah check-in.';
const LANGSUNG_DATE_MESSAGE =
  'Reservasi langsung hanya untuk tamu yang menginap mulai hari ini.';

/** Namespace kunci advisory untuk serialisasi cek-ketersediaan per tipe kamar. */
const ROOM_TYPE_LOCK_NAMESPACE = 7001;

const reservationWithItems = {
  include: {
    items: {
      include: {
        roomType: {
          include: { translations: { where: { languageCode: 'ID' as const } } },
        },
      },
    },
    payments: true,
    editLogs: {
      include: { editedBy: { select: { id: true, name: true } } },
      orderBy: { editedAt: 'desc' as const },
    },
  },
} satisfies Prisma.ReservationDefaultArgs;
type ReservationWithItems = Prisma.ReservationGetPayload<typeof reservationWithItems>;

const ROOM_TYPE_UNAVAILABLE_MESSAGE = 'Tipe tenda tidak tersedia.';

/** Validasi per unit: pilihan extra bed & kapasitas dewasa (extra bed = +1 dewasa). */
function assertItemGuests(
  item: { adults: number; children?: number; extraBedQty?: number; extraBedType?: string },
  roomType: { capacity: number; extraFlatPrice: unknown },
  name: string,
): void {
  const extraBedQty = item.extraBedQty ?? 0;
  if (extraBedQty > 0 && !item.extraBedType && !roomType.extraFlatPrice) {
    throw new BadRequestException('Pilih jenis extra bed.');
  }
  const capacityError = validateAdultCapacity(
    item.adults,
    roomType.capacity,
    extraBedQty,
    name,
  );
  if (capacityError) throw new BadRequestException(capacityError);
  const childrenError = validateChildrenCapacity(
    item.children ?? 0,
    roomType.capacity,
    extraBedQty,
    name,
  );
  if (childrenError) throw new BadRequestException(childrenError);
}

/** Urutan maju DP → LUNAS → CHECKED_IN — dipakai buat validasi transisi. */
const FORWARD_ORDER: ReservationStatus[] = [
  ReservationStatus.DP,
  ReservationStatus.LUNAS,
  ReservationStatus.CHECKED_IN,
];

@Injectable()
export class ReservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomTypesService: RoomTypesService,
  ) {}

  // ── kode reservasi (§7 PROJECT.md — acak, sulit ditebak, DGC-XXXXXX) ──

  private randomCodeSuffix(): string {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    return code;
  }

  private async generateUniqueReservationCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `DGC-${this.randomCodeSuffix()}`;
      const existing = await this.prisma.reservation.findUnique({
        where: { reservationCode: code },
      });
      if (!existing) return code;
    }
    throw new Error(
      'Gagal membuat kode reservasi unik setelah beberapa percobaan',
    );
  }

  // ── Create (§6.1, §8.1 PROJECT.md) ──

  async create(dto: CreateReservationDto, createdById: number) {
    const stayError = validateStayDates(dto.checkIn, dto.checkOut);
    if (stayError) throw new BadRequestException(stayError);
    // Check-in tidak boleh sebelum hari ini (WIB); hari ini boleh.
    if (isBeforeTodayWib(dto.checkIn)) {
      throw new BadRequestException(PAST_CHECKIN_MESSAGE);
    }
    // Reservasi langsung = tamu datang & menginap mulai hari ini (WIB).
    if (
      dto.channel === ReservationChannel.LANGSUNG &&
      !isTodayWib(dto.checkIn)
    ) {
      throw new BadRequestException(LANGSUNG_DATE_MESSAGE);
    }
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    // Diambil duluan (+ nama ID) biar pesan error ketersediaan/harga nyebut
    // nama tenda ("Eagle Hill"), bukan id database mentah yang gak dikenal admin.
    const roomTypes = await this.prisma.roomType.findMany({
      where: {
        id: { in: dto.items.map((i) => i.roomTypeId) },
        isActive: true,
        deletedAt: null,
      },
      include: { translations: { where: { languageCode: 'ID' } } },
    });
    const roomTypeName = (id: number) =>
      roomTypes.find((rt) => rt.id === id)?.translations[0]?.name ?? `#${id}`;

    const nights = calcNights(checkIn, checkOut);

    const itemsData = dto.items.map((item) => {
      const roomType = roomTypes.find((rt) => rt.id === item.roomTypeId);
      if (!roomType) {
        throw new NotFoundException(ROOM_TYPE_UNAVAILABLE_MESSAGE);
      }
      assertItemGuests(item, roomType, roomTypeName(roomType.id));

      const stay = calcStayPrice(
        {
          priceWeekday: Number(roomType.priceWeekday),
          priceWeekend: Number(roomType.priceWeekend),
        },
        checkIn,
        checkOut,
      );
      const extraBedQty = item.extraBedQty ?? 0;
      const rate =
        extraBedQty > 0
          ? extraBedRate(
              {
                extraBedPrice: roomType.extraBedPrice
                  ? Number(roomType.extraBedPrice)
                  : null,
                extraNoBedPrice: roomType.extraNoBedPrice
                  ? Number(roomType.extraNoBedPrice)
                  : null,
                extraFlatPrice: roomType.extraFlatPrice
                  ? Number(roomType.extraFlatPrice)
                  : null,
              },
              item.extraBedType ?? 'WITHOUT_BED',
            )
          : 0;

      return {
        roomTypeId: item.roomTypeId,
        adults: item.adults,
        children: item.children,
        extraBedQty,
        extraBedType: extraBedQty > 0 ? item.extraBedType : undefined,
        extraBedPrice: rate,
        subtotalSnapshot: stay + extraBedQty * rate * nights,
      };
    });

    const autoTotal = itemsData.reduce((sum, i) => sum + i.subtotalSnapshot, 0);
    const grossTotal =
      dto.isPriceOverride && dto.manualTotal != null
        ? dto.manualTotal
        : autoTotal;
    // Discount berlaku di atas total manapun yang menang (otomatis atau
    // override manual) — bukan cuma otomatis. `priceSnapshot` yang dibekukan
    // di bawah SUDAH net (setelah dikurangi discount).
    const discount = dto.discount ?? 0;
    const discountError = validateDiscount(grossTotal, discount);
    if (discountError) throw new BadRequestException(discountError);
    const total = Math.max(0, grossTotal - discount);

    // Status awal sesuai channel (§6.1) — Langsung selalu CHECKED_IN, DTO sudah
    // memvalidasi `initialStatus` wajib DP/LUNAS untuk Reservasi.
    const status: ReservationStatus =
      dto.channel === ReservationChannel.LANGSUNG
        ? ReservationStatus.CHECKED_IN
        : (dto.initialStatus as ReservationStatus);

    if (status === ReservationStatus.DP) {
      const dpError = validateDownPayment(total, dto.paidAmount!);
      if (dpError) throw new BadRequestException(dpError);
    }

    const now = new Date();
    const reservationCode = await this.generateUniqueReservationCode();

    const reservation = await this.prisma.$transaction(async (tx) => {
      // Ketersediaan — cegah double-pemesanan (§4.8). Dicek DI DALAM transaksi
      // dengan advisory lock per tipe kamar supaya dua permintaan bersamaan
      // tidak sama-sama lolos.
      await this.assertUnitsAvailable(
        tx,
        dto.items,
        checkIn,
        checkOut,
        undefined,
        roomTypeName,
      );

      // Dibuat TANPA `...reservationWithItems` dulu — begitu di-spread di sini,
      // `payments` bakal ke-fetch kosong (baris Payment-nya baru dibuat di
      // bawah), jadi respons `paidTotal`-nya keliru. Query ulang lengkap di
      // akhir transaksi setelah Payment ikut dibuat.
      const created = await tx.reservation.create({
        data: {
          reservationCode,
          guestName: dto.guestName,
          guestPhone: dto.guestPhone,
          checkIn,
          checkOut,
          priceSnapshot: total,
          isPriceOverride: dto.isPriceOverride ?? false,
          autoCalculatedTotal: autoTotal,
          discount,
          status,
          channel: dto.channel,
          notes: dto.notes,
          createdById,
          ...(status === ReservationStatus.LUNAS ? { lunasAt: now } : {}),
          ...(status === ReservationStatus.CHECKED_IN
            ? { lunasAt: now, checkedInAt: now }
            : {}),
          items: { create: itemsData },
        },
      });

      // Nominal yang beneran sudah masuk dicatat di `payments` — bukan cuma
      // disimpan sebagai angka lepas, biar bisa diverifikasi/dijumlah kapan
      // saja (§ "catat nominal DP via payments", ketemu FASE 8/9).
      if (dto.channel === ReservationChannel.LANGSUNG) {
        // Reservasi langsung dibayar penuh di tempat saat dicatat.
        await tx.payment.create({
          data: {
            reservationId: created.id,
            method: dto.payMethod!,
            amount: total,
            paidAt: now,
            recordedById: createdById,
          },
        });
      } else {
        // Reservasi: DP (nominal sesuai isian admin) atau langsung LUNAS
        // (total penuh) — pembayaran selalu transfer ke rekening, sesuai S&K.
        await tx.payment.create({
          data: {
            reservationId: created.id,
            method: PaymentMethod.BANK_TRANSFER,
            amount: status === ReservationStatus.LUNAS ? total : dto.paidAmount!,
            paidAt: now,
            recordedById: createdById,
          },
        });
      }

      return tx.reservation.findUniqueOrThrow({
        where: { id: created.id },
        ...reservationWithItems,
      });
    });

    return this.toAdminReservation(reservation);
  }

  /**
   * Kunci per tipe kamar (urut menaik, anti-deadlock) lalu pastikan jumlah unit
   * yang diminta per tipe tidak melebihi sisa unit. Harus dipanggil di dalam
   * transaksi; kunci dilepas otomatis saat transaksi selesai.
   */
  private async assertUnitsAvailable(
    tx: Prisma.TransactionClient,
    items: RequestedUnitItem[],
    checkIn: Date,
    checkOut: Date,
    excludeReservationId: number | undefined,
    roomTypeName: (id: number) => string,
  ): Promise<void> {
    const requested = groupRequestedUnits(items);
    for (const [roomTypeId] of requested) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${ROOM_TYPE_LOCK_NAMESPACE}::int, ${roomTypeId}::int)`;
    }
    for (const [roomTypeId, units] of requested) {
      const availability = await this.roomTypesService.checkAvailability(
        roomTypeId,
        checkIn,
        checkOut,
        excludeReservationId,
        tx,
      );
      if (availability.availableUnits < units) {
        throw new ConflictException(
          insufficientUnitsMessage(
            roomTypeName(roomTypeId),
            availability.availableUnits,
          ),
        );
      }
    }
  }

  // ── Read ──

  async findAllAdmin() {
    const reservations = await this.prisma.reservation.findMany({
      ...reservationWithItems,
      orderBy: { createdAt: 'desc' },
    });
    return reservations.map((b) => this.toAdminReservation(b));
  }

  async findByCodeOrThrow(code: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationCode: code },
      ...reservationWithItems,
    });
    if (!reservation) {
      throw new NotFoundException(`Reservasi ${code} tidak ditemukan`);
    }
    return this.toAdminReservation(reservation);
  }

  // ── Ubah status (§6.2, §8 FASE 8 — transisi gak boleh mundur/loncat) ──

  async updateStatus(
    code: string,
    dto: UpdateReservationStatusDto,
    recordedById: number,
  ) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationCode: code },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservasi ${code} tidak ditemukan`);
    }

    this.assertValidTransition(reservation.status, dto.status);

    // Check-in hanya dalam rentang menginap (WIB): mulai tanggal check-in,
    // sebelum tanggal check-out. Tamu datang lebih awal → ubah dulu tanggal
    // check-in reservasinya (ketersediaan dicek ulang), baru check-in.
    if (dto.status === 'CHECKED_IN') {
      const today = todayWib();
      const ci = reservation.checkIn.toISOString().slice(0, 10);
      const co = reservation.checkOut.toISOString().slice(0, 10);
      if (today < ci) {
        throw new BadRequestException(CHECKIN_TOO_EARLY_MESSAGE);
      }
      if (today >= co) {
        throw new BadRequestException(CHECKIN_TOO_LATE_MESSAGE);
      }
    }

    const now = new Date();
    const data: Prisma.ReservationUpdateInput = { status: dto.status };
    if (dto.status === 'LUNAS') data.lunasAt = now;
    if (dto.status === 'CHECKED_IN') data.checkedInAt = now;
    if (dto.status === 'HANGUS') data.hangusAt = now;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Transisi ke LUNAS: catat pelunasan sisa ke `payments` (bukan cuma
      // ubah status) — biar Σ payments selalu = priceSnapshot begitu LUNAS.
      if (dto.status === 'LUNAS') {
        const paidSoFar = await tx.payment.aggregate({
          where: { reservationId: reservation.id },
          _sum: { amount: true },
        });
        const remaining =
          Number(reservation.priceSnapshot) - Number(paidSoFar._sum.amount ?? 0);
        if (remaining > 0) {
          await tx.payment.create({
            data: {
              reservationId: reservation.id,
              method: PaymentMethod.BANK_TRANSFER,
              amount: remaining,
              paidAt: now,
              recordedById,
            },
          });
        }
      }

      return tx.reservation.update({
        where: { reservationCode: code },
        data,
        ...reservationWithItems,
      });
    });

    return this.toAdminReservation(updated);
  }

  // ── Edit reservasi dengan audit trail (anti-korupsi — setiap perubahan tercatat) ──

  async editReservation(code: string, dto: EditReservationDto, editorId: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { reservationCode: code },
      ...reservationWithItems,
    });
    if (!reservation) {
      throw new NotFoundException(`Reservasi ${code} tidak ditemukan`);
    }

    // Rentang menginap akhir (gabungan nilai baru + lama) harus valid.
    if (dto.checkIn !== undefined || dto.checkOut !== undefined) {
      const stayError = validateStayDates(
        dto.checkIn ?? reservation.checkIn.toISOString().slice(0, 10),
        dto.checkOut ?? reservation.checkOut.toISOString().slice(0, 10),
      );
      if (stayError) throw new BadRequestException(stayError);
    }

    // Validasi hanya kalau check-in benar-benar diubah, supaya reservasi lama
    // (mis. COMPLETED) dengan check-in lampau tetap bisa diedit catatannya.
    if (
      dto.checkIn !== undefined &&
      dto.checkIn.slice(0, 10) !== reservation.checkIn.toISOString().slice(0, 10) &&
      isBeforeTodayWib(dto.checkIn)
    ) {
      throw new BadRequestException(PAST_CHECKIN_MESSAGE);
    }

    // Tamu yang sudah check-in tanggal kedatangannya sudah terjadi — tidak boleh
    // digeser (mencegah status Check-in dengan tanggal check-in di masa depan).
    // Tanggal check-out tetap boleh diubah (perpanjang/persingkat menginap).
    if (
      dto.checkIn !== undefined &&
      dto.checkIn.slice(0, 10) !== reservation.checkIn.toISOString().slice(0, 10) &&
      (reservation.status === ReservationStatus.CHECKED_IN ||
        reservation.status === ReservationStatus.COMPLETED)
    ) {
      throw new BadRequestException(CHECKED_IN_DATE_LOCKED_MESSAGE);
    }

    // S&K poin 6: reschedule paling lambat 7 hari sebelum tanggal check-in
    // semula. Pengecualian: tamu datang lebih awal (check-in dimajukan ke hari
    // ini) — itu penyesuaian kedatangan, bukan reschedule. Mengubah check-out
    // saja (perpanjang/persingkat) juga bukan reschedule.
    if (
      dto.checkIn !== undefined &&
      dto.checkIn.slice(0, 10) !== reservation.checkIn.toISOString().slice(0, 10) &&
      !isTodayWib(dto.checkIn) &&
      daysBetween(todayWib(), reservation.checkIn.toISOString().slice(0, 10)) < RESCHEDULE_MIN_DAYS
    ) {
      throw new BadRequestException(RESCHEDULE_TOO_LATE_MESSAGE);
    }

    const datesChanging =
      dto.checkIn !== undefined || dto.checkOut !== undefined;
    const roomsChanging = dto.items !== undefined;
    const structureChanging = datesChanging || roomsChanging;

    const oldCheckInStr = reservation.checkIn.toISOString().slice(0, 10);
    const oldCheckOutStr = reservation.checkOut.toISOString().slice(0, 10);

    // Hitung ulang harga kalau tanggal/kamar berubah.
    let newAutoTotal =
      Number(reservation.autoCalculatedTotal ?? reservation.priceSnapshot) +
      Number(reservation.discount);
    let newItemsData:
      | {
          roomTypeId: number;
          adults: number;
          children: number;
          extraBedQty: number;
          extraBedType: string | undefined;
          extraBedPrice: number;
          subtotalSnapshot: number;
        }[]
      | null = null;
    let resolvedRoomTypes: { id: number; slug: string }[] | null = null;
    let availabilityCheck: {
      items: RequestedUnitItem[];
      checkIn: Date;
      checkOut: Date;
      nameOf: (id: number) => string;
    } | null = null;

    if (structureChanging) {
      const newCheckIn = new Date(dto.checkIn ?? oldCheckInStr);
      const newCheckOut = new Date(dto.checkOut ?? oldCheckOutStr);
      const newItemDtos =
        dto.items ??
        reservation.items.map((i) => ({
          roomTypeId: i.roomTypeId,
          qty: i.qty,
          adults: i.adults,
          children: i.children,
          extraBedQty: i.extraBedQty,
          extraBedType: i.extraBedType as
            'WITH_BED' | 'WITHOUT_BED' | undefined,
        }));

      const roomTypes = await this.prisma.roomType.findMany({
        where: { id: { in: newItemDtos.map((i) => i.roomTypeId) } },
        include: { translations: { where: { languageCode: 'ID' } } },
      });
      const nameOfRoomType = (id: number) =>
        roomTypes.find((r) => r.id === id)?.translations[0]?.name ?? `#${id}`;
      // Item yang dikirim admin harus tipe aktif & belum dihapus; item lama
      // (tidak dikirim ulang) dibiarkan agar reservasi lama tetap bisa diedit.
      for (const item of dto.items ?? []) {
        const rt = roomTypes.find((r) => r.id === item.roomTypeId);
        if (!rt || !rt.isActive || rt.deletedAt) {
          throw new NotFoundException(ROOM_TYPE_UNAVAILABLE_MESSAGE);
        }
        assertItemGuests(item, rt, nameOfRoomType(rt.id));
      }
      resolvedRoomTypes = roomTypes.map((rt) => ({ id: rt.id, slug: rt.slug }));

      // Dicek di dalam transaksi (di bawah) bersama advisory lock.
      availabilityCheck = {
        items: newItemDtos.map((i) => ({
          roomTypeId: i.roomTypeId,
          qty: 'qty' in i ? (i.qty as number) : 1,
        })),
        checkIn: newCheckIn,
        checkOut: newCheckOut,
        nameOf: (id: number) =>
          roomTypes.find((r) => r.id === id)?.translations[0]?.name ?? `#${id}`,
      };

      const nights = calcNights(newCheckIn, newCheckOut);
      newItemsData = newItemDtos.map((item) => {
        const rt = roomTypes.find((r) => r.id === item.roomTypeId)!;
        const stay = calcStayPrice(
          {
            priceWeekday: Number(rt.priceWeekday),
            priceWeekend: Number(rt.priceWeekend),
          },
          newCheckIn,
          newCheckOut,
        );
        const extraBedQty = item.extraBedQty ?? 0;
        const rate =
          extraBedQty > 0
            ? extraBedRate(
                {
                  extraBedPrice: rt.extraBedPrice
                    ? Number(rt.extraBedPrice)
                    : null,
                  extraNoBedPrice: rt.extraNoBedPrice
                    ? Number(rt.extraNoBedPrice)
                    : null,
                  extraFlatPrice: rt.extraFlatPrice
                    ? Number(rt.extraFlatPrice)
                    : null,
                },
                item.extraBedType ?? 'WITHOUT_BED',
              )
            : 0;
        return {
          roomTypeId: item.roomTypeId,
          adults: item.adults,
          children: item.children,
          extraBedQty,
          extraBedType: extraBedQty > 0 ? item.extraBedType : undefined,
          extraBedPrice: rate,
          subtotalSnapshot: stay + extraBedQty * rate * nights,
        };
      });
      newAutoTotal = newItemsData.reduce(
        (sum, i) => sum + i.subtotalSnapshot,
        0,
      );
    }

    // Ketika tanggal/kamar berubah: reset override ke auto kecuali admin set manual eksplisit.
    const newIsPriceOverride = structureChanging
      ? dto.priceOverride !== undefined
      : dto.priceOverride !== undefined
        ? true
        : reservation.isPriceOverride;

    const currentGross = reservation.isPriceOverride
      ? Number(reservation.priceSnapshot) + Number(reservation.discount)
      : Number(reservation.autoCalculatedTotal ?? reservation.priceSnapshot) +
        Number(reservation.discount);
    const newGross =
      dto.priceOverride !== undefined
        ? dto.priceOverride
        : structureChanging
          ? newAutoTotal
          : currentGross;
    const newDiscount =
      dto.discount !== undefined ? dto.discount : Number(reservation.discount);
    if (
      structureChanging ||
      dto.priceOverride !== undefined ||
      dto.discount !== undefined
    ) {
      const discountError = validateDiscount(newGross, newDiscount);
      if (discountError) throw new BadRequestException(discountError);
    }
    const newPriceSnapshot = Math.max(0, newGross - newDiscount);

    // Diff — hanya field yang benar-benar berubah.
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (dto.guestName !== undefined && dto.guestName !== reservation.guestName) {
      changes.guestName = { from: reservation.guestName, to: dto.guestName };
    }
    if (dto.guestPhone !== undefined && dto.guestPhone !== reservation.guestPhone) {
      changes.guestPhone = { from: reservation.guestPhone, to: dto.guestPhone };
    }
    if (dto.notes !== undefined && dto.notes !== (reservation.notes ?? '')) {
      changes.notes = { from: reservation.notes, to: dto.notes || null };
    }
    if (dto.checkIn && dto.checkIn !== oldCheckInStr) {
      changes.checkIn = { from: oldCheckInStr, to: dto.checkIn };
    }
    if (dto.checkOut && dto.checkOut !== oldCheckOutStr) {
      changes.checkOut = { from: oldCheckOutStr, to: dto.checkOut };
    }
    if (dto.items && resolvedRoomTypes) {
      const oldRooms = reservation.items.map((i) => i.roomType.slug).join(', ');
      const newRooms = (newItemsData ?? [])
        .map(
          (i) =>
            resolvedRoomTypes.find((rt) => rt.id === i.roomTypeId)?.slug ??
            i.roomTypeId,
        )
        .join(', ');
      if (oldRooms !== newRooms) {
        changes.rooms = { from: oldRooms, to: newRooms };
      }
    }
    if (newPriceSnapshot !== Number(reservation.priceSnapshot)) {
      changes.priceSnapshot = {
        from: Number(reservation.priceSnapshot),
        to: newPriceSnapshot,
      };
    }
    if (newDiscount !== Number(reservation.discount)) {
      changes.discount = { from: Number(reservation.discount), to: newDiscount };
    }
    if (
      structureChanging &&
      newAutoTotal !== Number(reservation.autoCalculatedTotal ?? 0)
    ) {
      changes.autoCalculatedTotal = {
        from: Number(reservation.autoCalculatedTotal),
        to: newAutoTotal,
      };
    }

    if (Object.keys(changes).length === 0) {
      return this.toAdminReservation(reservation);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (availabilityCheck) {
        await this.assertUnitsAvailable(
          tx,
          availabilityCheck.items,
          availabilityCheck.checkIn,
          availabilityCheck.checkOut,
          reservation.id,
          availabilityCheck.nameOf,
        );
      }
      if (newItemsData) {
        await tx.reservationItem.deleteMany({ where: { reservationId: reservation.id } });
        await tx.reservationItem.createMany({
          data: newItemsData.map((i) => ({
            ...i,
            reservationId: reservation.id,
            extraBedType: i.extraBedType as
              import('../../generated/prisma/enums').ExtraBedType | undefined,
          })),
        });
      }

      await tx.reservation.update({
        where: { reservationCode: code },
        data: {
          ...(dto.guestName !== undefined && { guestName: dto.guestName }),
          ...(dto.guestPhone !== undefined && { guestPhone: dto.guestPhone }),
          ...(dto.notes !== undefined && { notes: dto.notes || null }),
          ...(dto.checkIn !== undefined && { checkIn: new Date(dto.checkIn) }),
          ...(dto.checkOut !== undefined && {
            checkOut: new Date(dto.checkOut),
          }),
          priceSnapshot: newPriceSnapshot,
          discount: newDiscount,
          isPriceOverride: newIsPriceOverride,
          ...(structureChanging && { autoCalculatedTotal: newAutoTotal }),
        },
      });

      await tx.reservationEditLog.create({
        data: {
          reservationId: reservation.id,
          editedById: editorId,
          note: dto.note,
          changes: changes as Prisma.InputJsonValue,
        },
      });

      return tx.reservation.findUniqueOrThrow({
        where: { reservationCode: code },
        ...reservationWithItems,
      });
    });

    return this.toAdminReservation(updated);
  }

  private assertValidTransition(
    current: ReservationStatus,
    next: 'LUNAS' | 'CHECKED_IN' | 'HANGUS' | 'COMPLETED' | 'NO_SHOW',
  ): void {
    if (next === 'HANGUS') {
      // HANGUS boleh dari DP/LUNAS kapan saja sebelum check-in (§6.2).
      if (current !== ReservationStatus.DP && current !== ReservationStatus.LUNAS) {
        throw new ConflictException(
          `Reservasi berstatus ${current} tidak bisa dibatalkan (HANGUS)`,
        );
      }
      return;
    }
    if (next === 'COMPLETED') {
      if (current !== ReservationStatus.CHECKED_IN) {
        throw new ConflictException(
          `Hanya reservasi CHECKED_IN yang bisa ditandai Selesai`,
        );
      }
      return;
    }
    if (next === 'NO_SHOW') {
      if (current !== ReservationStatus.LUNAS) {
        throw new ConflictException(
          `Hanya reservasi LUNAS yang bisa ditandai Tidak Datang`,
        );
      }
      return;
    }

    const currentIdx = FORWARD_ORDER.indexOf(current);
    const nextIdx = FORWARD_ORDER.indexOf(next);
    if (currentIdx === -1 || nextIdx !== currentIdx + 1) {
      throw new ConflictException(
        `Transisi status ${current} → ${next} tidak valid`,
      );
    }
  }

  // ── Status turunan (§6.2 — dihitung on-read, bukan kolom, bukan cron) ──

  computeEffectiveStatus(
    status: ReservationStatus,
    checkOut: Date,
    today: Date = new Date(),
  ): string {
    // Status tersimpan manual menang atas komputasi otomatis.
    if (status === ReservationStatus.COMPLETED) return 'COMPLETED';
    if (status === ReservationStatus.NO_SHOW) return 'NO_SHOW';
    const pastCheckout = today > checkOut;
    if (status === ReservationStatus.CHECKED_IN)
      return pastCheckout ? 'COMPLETED' : 'CHECKED_IN';
    if (status === ReservationStatus.LUNAS && pastCheckout) return 'NO_SHOW';
    if (status === ReservationStatus.DP && pastCheckout) return 'HANGUS';
    return status;
  }

  // ── Mapper ──

  private toAdminReservation(reservation: ReservationWithItems) {
    return {
      id: reservation.id,
      reservationCode: reservation.reservationCode,
      guestName: reservation.guestName,
      guestPhone: reservation.guestPhone,
      checkIn: reservation.checkIn,
      checkOut: reservation.checkOut,
      createdAt: reservation.createdAt,
      priceSnapshot: Number(reservation.priceSnapshot),
      autoCalculatedTotal:
        reservation.autoCalculatedTotal !== null
          ? Number(reservation.autoCalculatedTotal)
          : null,
      discount: Number(reservation.discount),
      // Σ payments yang tercatat — nominal yang BENERAN sudah masuk, bukan
      // asumsi (mis. "DP pasti 50%"). Lihat DetailModal "Sudah dibayar".
      paidTotal: reservation.payments
        .reduce((sum, p) => sum + Number(p.amount), 0),
      // Daftar transaksi mentah (bukan cuma agregat) — dipakai Ringkasan buat
      // "Pendapatan Hari Ini" (dihitung dari tanggal transaksi TERCATAT,
      // beda dari tanggal check-in reservasinya).
      payments: reservation.payments
        .map((p) => ({ amount: Number(p.amount), paidAt: p.paidAt })),
      isPriceOverride: reservation.isPriceOverride,
      status: reservation.status,
      effectiveStatus: this.computeEffectiveStatus(
        reservation.status,
        reservation.checkOut,
      ),
      channel: reservation.channel,
      notes: reservation.notes,
      items: reservation.items.map((i) => ({
        roomTypeId: i.roomTypeId,
        roomTypeSlug: i.roomType.slug,
        roomTypeName: i.roomType.translations[0]?.name ?? i.roomType.slug,
        roomTypeCategory: i.roomType.translations[0]?.category ?? '',
        adults: i.adults,
        children: i.children,
        extraBedQty: i.extraBedQty,
        extraBedType: i.extraBedType,
        extraBedPrice: Number(i.extraBedPrice),
        subtotalSnapshot: Number(i.subtotalSnapshot),
      })),
      editLogs: reservation.editLogs.map((log) => ({
        id: log.id,
        editedAt: log.editedAt,
        editedByName: log.editedBy.name,
        note: log.note,
        changes: log.changes as Record<string, { from: unknown; to: unknown }>,
      })),
    };
  }
}
