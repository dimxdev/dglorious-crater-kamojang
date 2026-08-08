import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'crypto';
import { Prisma } from '../../generated/prisma/client';
import {
  BookingChannel,
  BookingSource,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import {
  calcNights,
  calcStayPrice,
  extraBedRate,
} from '../room-types/pricing.util';
import { RoomTypesService } from '../room-types/room-types.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { EditBookingDto } from './dto/edit-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

// Alfabet tanpa 0/O/1/I — hindari salah baca pas admin dikte kode via telepon/WA.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const bookingWithItems = {
  include: {
    items: { include: { roomType: true } },
    payments: true,
    editLogs: {
      include: { editedBy: { select: { id: true, name: true } } },
      orderBy: { editedAt: 'desc' as const },
    },
  },
} satisfies Prisma.BookingDefaultArgs;
type BookingWithItems = Prisma.BookingGetPayload<typeof bookingWithItems>;

/** Urutan maju DP → LUNAS → CHECKED_IN — dipakai buat validasi transisi. */
const FORWARD_ORDER: BookingStatus[] = [
  BookingStatus.DP,
  BookingStatus.LUNAS,
  BookingStatus.CHECKED_IN,
];

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomTypesService: RoomTypesService,
  ) {}

  // ── booking_code (§7 PROJECT.md — acak, sulit ditebak, DGC-XXXXXX) ──

  private randomCodeSuffix(): string {
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    }
    return code;
  }

  private async generateUniqueBookingCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `DGC-${this.randomCodeSuffix()}`;
      const existing = await this.prisma.booking.findUnique({
        where: { bookingCode: code },
      });
      if (!existing) return code;
    }
    throw new Error(
      'Gagal membuat booking_code unik setelah beberapa percobaan',
    );
  }

  // ── Create (§6.1, §8.1 PROJECT.md) ──

  async create(dto: CreateBookingDto, createdById: number) {
    const checkIn = new Date(dto.checkIn);
    const checkOut = new Date(dto.checkOut);

    // Diambil duluan (+ nama ID) biar pesan error ketersediaan/harga nyebut
    // nama tenda ("Eagle Hill"), bukan id database mentah yang gak dikenal admin.
    const roomTypes = await this.prisma.roomType.findMany({
      where: { id: { in: dto.items.map((i) => i.roomTypeId) } },
      include: { translations: { where: { languageCode: 'ID' } } },
    });
    const roomTypeName = (id: number) =>
      roomTypes.find((rt) => rt.id === id)?.translations[0]?.name ?? `#${id}`;

    // Ketersediaan — cegah double-booking (§4.8), reuse fungsi FASE 5.
    for (const item of dto.items) {
      const availability = await this.roomTypesService.checkAvailability(
        item.roomTypeId,
        checkIn,
        checkOut,
      );
      if (!availability.isAvailable) {
        throw new ConflictException(
          `${roomTypeName(item.roomTypeId)} tidak tersedia untuk tanggal yang dipilih`,
        );
      }
    }

    const nights = calcNights(checkIn, checkOut);

    const itemsData = dto.items.map((item) => {
      const roomType = roomTypes.find((rt) => rt.id === item.roomTypeId);
      if (!roomType) {
        throw new NotFoundException(
          `Room type ${item.roomTypeId} tidak ditemukan`,
        );
      }

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
        extraBedQty > 0 && item.extraBedType
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
              item.extraBedType,
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
    const total = Math.max(0, grossTotal - discount);

    // Status awal sesuai channel (§6.1) — Walk-in selalu CHECKED_IN, DTO sudah
    // memvalidasi `initialStatus` wajib DP/LUNAS untuk WhatsApp.
    const status: BookingStatus =
      dto.bookingChannel === BookingChannel.WALK_IN
        ? BookingStatus.CHECKED_IN
        : (dto.initialStatus as BookingStatus);

    const now = new Date();
    const bookingCode = await this.generateUniqueBookingCode();

    const booking = await this.prisma.$transaction(async (tx) => {
      // Dibuat TANPA `...bookingWithItems` dulu — begitu di-spread di sini,
      // `payments` bakal ke-fetch kosong (baris Payment-nya baru dibuat di
      // bawah), jadi respons `paidTotal`-nya keliru. Query ulang lengkap di
      // akhir transaksi setelah Payment ikut dibuat.
      const created = await tx.booking.create({
        data: {
          bookingCode,
          guestName: dto.guestName,
          guestPhone: dto.guestPhone,
          checkIn,
          checkOut,
          priceSnapshot: total,
          isPriceOverride: dto.isPriceOverride ?? false,
          autoCalculatedTotal: autoTotal,
          discount,
          status,
          bookingChannel: dto.bookingChannel,
          bookingSource: BookingSource.MANUAL,
          notes: dto.notes,
          createdById,
          ...(status === BookingStatus.LUNAS ? { lunasAt: now } : {}),
          ...(status === BookingStatus.CHECKED_IN
            ? { lunasAt: now, checkedInAt: now }
            : {}),
          items: { create: itemsData },
        },
      });

      // Nominal yang beneran sudah masuk dicatat di `payments` — bukan cuma
      // disimpan sebagai angka lepas, biar bisa diverifikasi/dijumlah kapan
      // saja (§ "catat nominal DP via payments", ketemu FASE 8/9).
      if (dto.bookingChannel === BookingChannel.WALK_IN) {
        // Walk-in dibayar penuh di tempat saat dicatat.
        await tx.payment.create({
          data: {
            bookingId: created.id,
            method: dto.payMethod!,
            amount: total,
            status: PaymentStatus.PAID,
            paidAt: now,
            verifiedById: createdById,
          },
        });
      } else {
        // WhatsApp: DP (nominal sesuai isian admin) atau langsung LUNAS
        // (total penuh) — pembayaran selalu transfer ke rekening, sesuai S&K.
        await tx.payment.create({
          data: {
            bookingId: created.id,
            method: PaymentMethod.BANK_TRANSFER,
            amount: status === BookingStatus.LUNAS ? total : dto.paidAmount!,
            status: PaymentStatus.PAID,
            paidAt: now,
            verifiedById: createdById,
          },
        });
      }

      return tx.booking.findUniqueOrThrow({
        where: { id: created.id },
        ...bookingWithItems,
      });
    });

    return this.toAdminBooking(booking);
  }

  // ── Read (dasar untuk FASE 8/9 — belum ada FE yang manggil selain smoke-test) ──

  async findAllAdmin() {
    const bookings = await this.prisma.booking.findMany({
      ...bookingWithItems,
      orderBy: { createdAt: 'desc' },
    });
    return bookings.map((b) => this.toAdminBooking(b));
  }

  async findByCodeOrThrow(code: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: code },
      ...bookingWithItems,
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${code} tidak ditemukan`);
    }
    return this.toAdminBooking(booking);
  }

  // ── Ubah status (§6.2, §8 FASE 8 — transisi gak boleh mundur/loncat) ──

  async updateStatus(
    code: string,
    dto: UpdateBookingStatusDto,
    verifiedById: number,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: code },
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${code} tidak ditemukan`);
    }

    this.assertValidTransition(booking.status, dto.status);

    const now = new Date();
    const data: Prisma.BookingUpdateInput = { status: dto.status };
    if (dto.status === 'LUNAS') data.lunasAt = now;
    if (dto.status === 'CHECKED_IN') data.checkedInAt = now;
    if (dto.status === 'HANGUS') data.hangusAt = now;

    const updated = await this.prisma.$transaction(async (tx) => {
      // Transisi ke LUNAS: catat pelunasan sisa ke `payments` (bukan cuma
      // ubah status) — biar Σ payments selalu = priceSnapshot begitu LUNAS.
      if (dto.status === 'LUNAS') {
        const paidSoFar = await tx.payment.aggregate({
          where: { bookingId: booking.id, status: PaymentStatus.PAID },
          _sum: { amount: true },
        });
        const remaining =
          Number(booking.priceSnapshot) - Number(paidSoFar._sum.amount ?? 0);
        if (remaining > 0) {
          await tx.payment.create({
            data: {
              bookingId: booking.id,
              method: PaymentMethod.BANK_TRANSFER,
              amount: remaining,
              status: PaymentStatus.PAID,
              paidAt: now,
              verifiedById,
            },
          });
        }
      }

      return tx.booking.update({
        where: { bookingCode: code },
        data,
        ...bookingWithItems,
      });
    });

    return this.toAdminBooking(updated);
  }

  // ── Edit booking dengan audit trail (anti-korupsi — setiap perubahan tercatat) ──

  async editBooking(code: string, dto: EditBookingDto, editorId: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingCode: code },
      ...bookingWithItems,
    });
    if (!booking) {
      throw new NotFoundException(`Booking ${code} tidak ditemukan`);
    }

    const datesChanging = dto.checkIn !== undefined || dto.checkOut !== undefined;
    const roomsChanging = dto.items !== undefined;
    const structureChanging = datesChanging || roomsChanging;

    const oldCheckInStr = booking.checkIn.toISOString().slice(0, 10);
    const oldCheckOutStr = booking.checkOut.toISOString().slice(0, 10);

    // Hitung ulang harga kalau tanggal/kamar berubah.
    let newAutoTotal = Number(
      booking.autoCalculatedTotal ?? booking.priceSnapshot,
    ) + Number(booking.discount);
    let newItemsData: {
      roomTypeId: number;
      adults: number;
      children: number;
      extraBedQty: number;
      extraBedType: string | undefined;
      extraBedPrice: number;
      subtotalSnapshot: number;
    }[] | null = null;
    let resolvedRoomTypes: { id: number; slug: string }[] | null = null;

    if (structureChanging) {
      const newCheckIn = new Date(dto.checkIn ?? oldCheckInStr);
      const newCheckOut = new Date(dto.checkOut ?? oldCheckOutStr);
      const newItemDtos = dto.items ?? booking.items.map((i) => ({
        roomTypeId: i.roomTypeId,
        adults: i.adults,
        children: i.children,
        extraBedQty: i.extraBedQty,
        extraBedType: i.extraBedType as 'WITH_BED' | 'WITHOUT_BED' | undefined,
      }));

      const roomTypes = await this.prisma.roomType.findMany({
        where: { id: { in: newItemDtos.map((i) => i.roomTypeId) } },
      });
      resolvedRoomTypes = roomTypes.map((rt) => ({ id: rt.id, slug: rt.slug }));

      for (const item of newItemDtos) {
        const avail = await this.roomTypesService.checkAvailability(
          item.roomTypeId,
          newCheckIn,
          newCheckOut,
          booking.id,
        );
        if (!avail.isAvailable) {
          const rt = roomTypes.find((r) => r.id === item.roomTypeId);
          throw new ConflictException(
            `${rt?.slug ?? item.roomTypeId} tidak tersedia untuk tanggal tersebut`,
          );
        }
      }

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
          extraBedQty > 0 && item.extraBedType
            ? extraBedRate(
                {
                  extraBedPrice: rt.extraBedPrice ? Number(rt.extraBedPrice) : null,
                  extraNoBedPrice: rt.extraNoBedPrice ? Number(rt.extraNoBedPrice) : null,
                  extraFlatPrice: rt.extraFlatPrice ? Number(rt.extraFlatPrice) : null,
                },
                item.extraBedType,
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
      newAutoTotal = newItemsData.reduce((sum, i) => sum + i.subtotalSnapshot, 0);
    }

    // Ketika tanggal/kamar berubah: reset override ke auto kecuali admin set manual eksplisit.
    const newIsPriceOverride = structureChanging
      ? dto.priceOverride !== undefined
      : dto.priceOverride !== undefined
        ? true
        : booking.isPriceOverride;

    const currentGross = booking.isPriceOverride
      ? Number(booking.priceSnapshot) + Number(booking.discount)
      : Number(booking.autoCalculatedTotal ?? booking.priceSnapshot) + Number(booking.discount);
    const newGross =
      dto.priceOverride !== undefined
        ? dto.priceOverride
        : structureChanging
          ? newAutoTotal
          : currentGross;
    const newDiscount = dto.discount !== undefined ? dto.discount : Number(booking.discount);
    const newPriceSnapshot = Math.max(0, newGross - newDiscount);

    // Diff — hanya field yang benar-benar berubah.
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    if (dto.guestName !== undefined && dto.guestName !== booking.guestName) {
      changes.guestName = { from: booking.guestName, to: dto.guestName };
    }
    if (dto.guestPhone !== undefined && dto.guestPhone !== booking.guestPhone) {
      changes.guestPhone = { from: booking.guestPhone, to: dto.guestPhone };
    }
    if (dto.notes !== undefined && dto.notes !== (booking.notes ?? '')) {
      changes.notes = { from: booking.notes, to: dto.notes || null };
    }
    if (dto.checkIn && dto.checkIn !== oldCheckInStr) {
      changes.checkIn = { from: oldCheckInStr, to: dto.checkIn };
    }
    if (dto.checkOut && dto.checkOut !== oldCheckOutStr) {
      changes.checkOut = { from: oldCheckOutStr, to: dto.checkOut };
    }
    if (dto.items && resolvedRoomTypes) {
      const oldRooms = booking.items.map((i) => i.roomType.slug).join(', ');
      const newRooms = (newItemsData ?? [])
        .map((i) => resolvedRoomTypes!.find((rt) => rt.id === i.roomTypeId)?.slug ?? i.roomTypeId)
        .join(', ');
      if (oldRooms !== newRooms) {
        changes.rooms = { from: oldRooms, to: newRooms };
      }
    }
    if (newPriceSnapshot !== Number(booking.priceSnapshot)) {
      changes.priceSnapshot = { from: Number(booking.priceSnapshot), to: newPriceSnapshot };
    }
    if (newDiscount !== Number(booking.discount)) {
      changes.discount = { from: Number(booking.discount), to: newDiscount };
    }
    if (structureChanging && newAutoTotal !== Number(booking.autoCalculatedTotal ?? 0)) {
      changes.autoCalculatedTotal = {
        from: Number(booking.autoCalculatedTotal),
        to: newAutoTotal,
      };
    }

    if (Object.keys(changes).length === 0) {
      return this.toAdminBooking(booking);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (newItemsData) {
        await tx.bookingItem.deleteMany({ where: { bookingId: booking.id } });
        await tx.bookingItem.createMany({
          data: newItemsData.map((i) => ({
            ...i,
            bookingId: booking.id,
            extraBedType: i.extraBedType as import('../../generated/prisma/enums').ExtraBedType | undefined,
          })),
        });
      }

      await tx.booking.update({
        where: { bookingCode: code },
        data: {
          ...(dto.guestName !== undefined && { guestName: dto.guestName }),
          ...(dto.guestPhone !== undefined && { guestPhone: dto.guestPhone }),
          ...(dto.notes !== undefined && { notes: dto.notes || null }),
          ...(dto.checkIn !== undefined && { checkIn: new Date(dto.checkIn) }),
          ...(dto.checkOut !== undefined && { checkOut: new Date(dto.checkOut) }),
          priceSnapshot: newPriceSnapshot,
          discount: newDiscount,
          isPriceOverride: newIsPriceOverride,
          ...(structureChanging && { autoCalculatedTotal: newAutoTotal }),
        },
      });

      await tx.bookingEditLog.create({
        data: {
          bookingId: booking.id,
          editedById: editorId,
          note: dto.note,
          changes: changes as Prisma.InputJsonValue,
        },
      });

      return tx.booking.findUniqueOrThrow({
        where: { bookingCode: code },
        ...bookingWithItems,
      });
    });

    return this.toAdminBooking(updated);
  }

  private assertValidTransition(
    current: BookingStatus,
    next: 'LUNAS' | 'CHECKED_IN' | 'HANGUS' | 'COMPLETED' | 'NO_SHOW',
  ): void {
    if (next === 'HANGUS') {
      // HANGUS boleh dari DP/LUNAS kapan saja sebelum check-in (§6.2).
      if (
        current !== BookingStatus.DP &&
        current !== BookingStatus.LUNAS
      ) {
        throw new ConflictException(
          `Booking berstatus ${current} tidak bisa dibatalkan (HANGUS)`,
        );
      }
      return;
    }
    if (next === 'COMPLETED') {
      if (current !== BookingStatus.CHECKED_IN) {
        throw new ConflictException(
          `Hanya booking CHECKED_IN yang bisa ditandai Selesai`,
        );
      }
      return;
    }
    if (next === 'NO_SHOW') {
      if (current !== BookingStatus.LUNAS) {
        throw new ConflictException(
          `Hanya booking LUNAS yang bisa ditandai Tidak Datang`,
        );
      }
      return;
    }

    const currentIdx = FORWARD_ORDER.indexOf(current);
    const nextIdx = FORWARD_ORDER.indexOf(next as BookingStatus);
    if (currentIdx === -1 || nextIdx !== currentIdx + 1) {
      throw new ConflictException(
        `Transisi status ${current} → ${next} tidak valid`,
      );
    }
  }

  // ── Status turunan (§6.2 — dihitung on-read, bukan kolom, bukan cron) ──

  computeEffectiveStatus(
    status: BookingStatus,
    checkOut: Date,
    today: Date = new Date(),
  ): string {
    // Status tersimpan manual menang atas komputasi otomatis.
    if (status === BookingStatus.COMPLETED) return 'COMPLETED';
    if (status === BookingStatus.NO_SHOW) return 'NO_SHOW';
    const pastCheckout = today > checkOut;
    if (status === BookingStatus.CHECKED_IN)
      return pastCheckout ? 'COMPLETED' : 'CHECKED_IN';
    if (status === BookingStatus.LUNAS && pastCheckout) return 'NO_SHOW';
    if (status === BookingStatus.DP && pastCheckout) return 'HANGUS';
    return status;
  }

  // ── Mapper ──

  private toAdminBooking(booking: BookingWithItems) {
    return {
      id: booking.id,
      bookingCode: booking.bookingCode,
      guestName: booking.guestName,
      guestPhone: booking.guestPhone,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      createdAt: booking.createdAt,
      priceSnapshot: Number(booking.priceSnapshot),
      autoCalculatedTotal: booking.autoCalculatedTotal !== null ? Number(booking.autoCalculatedTotal) : null,
      discount: Number(booking.discount),
      // Σ payments yang PAID — nominal yang BENERAN sudah masuk, bukan
      // asumsi (mis. "DP pasti 50%"). Lihat DetailModal "Sudah dibayar".
      paidTotal: booking.payments
        .filter((p) => p.status === PaymentStatus.PAID)
        .reduce((sum, p) => sum + Number(p.amount), 0),
      // Daftar transaksi mentah (bukan cuma agregat) — dipakai Ringkasan buat
      // "Pendapatan Hari Ini" (dihitung dari tanggal transaksi TERCATAT,
      // beda dari tanggal check-in booking-nya).
      payments: booking.payments
        .filter((p) => p.status === PaymentStatus.PAID)
        .map((p) => ({ amount: Number(p.amount), paidAt: p.paidAt })),
      isPriceOverride: booking.isPriceOverride,
      status: booking.status,
      effectiveStatus: this.computeEffectiveStatus(
        booking.status,
        booking.checkOut,
      ),
      bookingChannel: booking.bookingChannel,
      notes: booking.notes,
      items: booking.items.map((i) => ({
        roomTypeId: i.roomTypeId,
        roomTypeSlug: i.roomType.slug,
        adults: i.adults,
        children: i.children,
        extraBedQty: i.extraBedQty,
        extraBedType: i.extraBedType,
        extraBedPrice: Number(i.extraBedPrice),
        subtotalSnapshot: Number(i.subtotalSnapshot),
      })),
      editLogs: booking.editLogs.map((log) => ({
        id: log.id,
        editedAt: log.editedAt,
        editedByName: log.editedBy.name,
        note: log.note,
        changes: log.changes as Record<string, { from: unknown; to: unknown }>,
      })),
    };
  }
}
