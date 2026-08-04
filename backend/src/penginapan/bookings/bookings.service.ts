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
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

// Alfabet tanpa 0/O/1/I — hindari salah baca pas admin dikte kode via telepon/WA.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const bookingWithItems = {
  include: { items: { include: { roomType: true } } },
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
    const total =
      dto.isPriceOverride && dto.manualTotal != null
        ? dto.manualTotal
        : autoTotal;

    // Status awal sesuai channel (§6.1) — Walk-in selalu CHECKED_IN, DTO sudah
    // memvalidasi `initialStatus` wajib DP/LUNAS untuk WhatsApp.
    const status: BookingStatus =
      dto.bookingChannel === BookingChannel.WALK_IN
        ? BookingStatus.CHECKED_IN
        : (dto.initialStatus as BookingStatus);

    const now = new Date();
    const bookingCode = await this.generateUniqueBookingCode();

    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          bookingCode,
          guestName: dto.guestName,
          guestPhone: dto.guestPhone,
          checkIn,
          checkOut,
          priceSnapshot: total,
          isPriceOverride: dto.isPriceOverride ?? false,
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
        ...bookingWithItems,
      });

      // Walk-in dibayar penuh di tempat saat dicatat — pakai tabel `payments`
      // yang sudah ada, bukan kolom baru (§8.1 keputusan FASE 7).
      if (dto.bookingChannel === BookingChannel.WALK_IN) {
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
      }

      return created;
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

  async updateStatus(code: string, dto: UpdateBookingStatusDto) {
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

    const updated = await this.prisma.booking.update({
      where: { bookingCode: code },
      data,
      ...bookingWithItems,
    });
    return this.toAdminBooking(updated);
  }

  private assertValidTransition(
    current: BookingStatus,
    next: 'LUNAS' | 'CHECKED_IN' | 'HANGUS',
  ): void {
    if (next === 'HANGUS') {
      // HANGUS boleh dari DP/LUNAS kapan saja sebelum check-in (§6.2).
      if (
        current === BookingStatus.CHECKED_IN ||
        current === BookingStatus.HANGUS
      ) {
        throw new ConflictException(
          `Booking berstatus ${current} tidak bisa dibatalkan (HANGUS)`,
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
    status: BookingStatus,
    checkOut: Date,
    today: Date = new Date(),
  ): string {
    const pastCheckout = today > checkOut;
    if (status === BookingStatus.CHECKED_IN)
      return pastCheckout ? 'COMPLETED' : status;
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
    };
  }
}
