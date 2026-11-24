import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { ReservationStatus, LanguageCode } from '../../generated/prisma/enums';
import { todayWib } from '../../common/date-wib';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { UpdateRoomTypeDto } from './dto/update-room-type.dto';
import { calcStayPrice } from './pricing.util';

type PublicLang = 'ID' | 'EN';

/** Shape actually stored in `RoomType.facilities` — see dto/facility.dto.ts. */
type FacilityJson = { icon: string; label: { id: string; en?: string } };

const roomTypeWithRelations = {
  include: { translations: true, images: { orderBy: { sortOrder: 'asc' } } },
} satisfies Prisma.RoomTypeDefaultArgs;
type RoomTypeWithRelations = Prisma.RoomTypeGetPayload<
  typeof roomTypeWithRelations
>;

@Injectable()
export class RoomTypesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Admin: CRUD ────────────────────────────────────────────

  async create(dto: CreateRoomTypeDto, createdById: number) {
    const existing = await this.prisma.roomType.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Slug "${dto.slug}" sudah dipakai`);
    }

    const roomType = await this.prisma.$transaction(async (tx) => {
      const created = await tx.roomType.create({
        data: {
          slug: dto.slug,
          priceWeekday: dto.priceWeekday,
          priceWeekend: dto.priceWeekend,
          capacity: dto.capacity,
          totalUnits: dto.totalUnits,
          extraBedPrice: dto.extraBedPrice ?? null,
          extraNoBedPrice: dto.extraNoBedPrice ?? null,
          extraFlatPrice: dto.extraFlatPrice ?? null,
          isActive: dto.isActive ?? true,
          facilities: dto.facilities as unknown as Prisma.InputJsonValue,
          createdById,
        },
      });

      await tx.roomTypeTranslation.create({
        data: {
          roomTypeId: created.id,
          languageCode: LanguageCode.ID,
          ...dto.translations.id,
        },
      });
      if (dto.translations.en) {
        await tx.roomTypeTranslation.create({
          data: {
            roomTypeId: created.id,
            languageCode: LanguageCode.EN,
            ...dto.translations.en,
          },
        });
      }

      return created;
    });

    return this.findOneAdminOrThrow(roomType.id);
  }

  async update(id: number, dto: UpdateRoomTypeDto) {
    const current = await this.findOneAdminOrThrow(id);
    const { translations, facilities, ...rest } = dto;

    if (rest.totalUnits !== undefined && rest.totalUnits < current.totalUnits) {
      const peak = await this.peakFutureBooking(id);
      if (peak && rest.totalUnits < peak.qty) {
        throw new BadRequestException(
          `Jumlah unit tidak boleh lebih kecil dari unit yang sudah direservasi (${peak.qty} unit pada ${peak.date}).`,
        );
      }
    }
    if (rest.isActive === false && current.isActive) {
      await this.assertNoFutureReservations(id, 'dinonaktifkan');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.roomType.update({
        where: { id },
        data: {
          ...rest,
          ...(facilities
            ? { facilities: facilities as unknown as Prisma.InputJsonValue }
            : {}),
        },
      });

      if (translations?.id) {
        await tx.roomTypeTranslation.upsert({
          where: {
            roomTypeId_languageCode: {
              roomTypeId: id,
              languageCode: LanguageCode.ID,
            },
          },
          update: translations.id,
          create: {
            roomTypeId: id,
            languageCode: LanguageCode.ID,
            ...translations.id,
          },
        });
      }
      if (translations?.en) {
        await tx.roomTypeTranslation.upsert({
          where: {
            roomTypeId_languageCode: {
              roomTypeId: id,
              languageCode: LanguageCode.EN,
            },
          },
          update: translations.en,
          create: {
            roomTypeId: id,
            languageCode: LanguageCode.EN,
            ...translations.en,
          },
        });
      }
    });

    return this.findOneAdminOrThrow(id);
  }

  async softDelete(id: number): Promise<void> {
    await this.findOneAdminOrThrow(id);
    await this.assertNoFutureReservations(id, 'dihapus');
    await this.prisma.roomType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  /** Reservasi aktif (bukan HANGUS) yang belum selesai (check-out setelah hari ini, WIB). */
  private futureReservationItems(roomTypeId: number) {
    return this.prisma.reservationItem.findMany({
      where: {
        roomTypeId,
        reservation: {
          status: { not: ReservationStatus.HANGUS },
          checkOut: { gt: new Date(`${todayWib()}T00:00:00.000Z`) },
        },
      },
      select: {
        qty: true,
        reservation: { select: { checkIn: true, checkOut: true } },
      },
    });
  }

  /** Tanggal dengan jumlah unit terpesan tertinggi dari hari ini ke depan. */
  private async peakFutureBooking(roomTypeId: number) {
    const items = await this.futureReservationItems(roomTypeId);
    const DAY = 86_400_000;
    const today = new Date(`${todayWib()}T00:00:00.000Z`).getTime();
    const perDay = new Map<number, number>();
    for (const it of items) {
      const start = Math.max(it.reservation.checkIn.getTime(), today);
      const end = it.reservation.checkOut.getTime();
      for (let t = start; t < end; t += DAY) {
        perDay.set(t, (perDay.get(t) ?? 0) + it.qty);
      }
    }
    let best: { qty: number; date: string } | null = null;
    for (const [t, qty] of [...perDay].sort((a, b) => a[0] - b[0])) {
      if (!best || qty > best.qty) {
        best = { qty, date: new Date(t).toISOString().slice(0, 10) };
      }
    }
    return best;
  }

  private async assertNoFutureReservations(
    roomTypeId: number,
    action: 'dihapus' | 'dinonaktifkan',
  ) {
    const items = await this.futureReservationItems(roomTypeId);
    if (items.length > 0) {
      throw new ConflictException(
        `Tipe ini tidak dapat ${action} karena masih memiliki ${items.length} reservasi aktif yang belum selesai. Batalkan atau selesaikan reservasi tersebut terlebih dahulu.`,
      );
    }
  }

  async findAllAdmin() {
    const roomTypes = await this.prisma.roomType.findMany({
      where: { deletedAt: null },
      ...roomTypeWithRelations,
      orderBy: { id: 'asc' },
    });
    return roomTypes.map((rt) => this.toAdminListItem(rt));
  }

  async findOneAdminOrThrow(id: number) {
    const roomType = await this.prisma.roomType.findFirst({
      where: { id, deletedAt: null },
      include: {
        translations: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!roomType) {
      throw new NotFoundException(`Room type ${id} tidak ditemukan`);
    }
    return roomType;
  }

  // ── Public: katalog (§8 PROJECT.md — fallback ID kalau EN kosong) ──

  async findAllPublic(lang: PublicLang) {
    const roomTypes = await this.prisma.roomType.findMany({
      where: { isActive: true, deletedAt: null },
      ...roomTypeWithRelations,
      orderBy: { id: 'asc' },
    });
    return roomTypes.map((rt) => this.toPublicSummary(rt, lang));
  }

  async findPublicBySlugOrThrow(slug: string, lang: PublicLang) {
    const roomType = await this.prisma.roomType.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      ...roomTypeWithRelations,
    });
    if (!roomType) {
      throw new NotFoundException(`Tenda/villa "${slug}" tidak ditemukan`);
    }
    return this.toPublicDetail(roomType, lang);
  }

  // ── Images ──

  async addImage(roomTypeId: number, imageUrl: string) {
    await this.findOneAdminOrThrow(roomTypeId);
    const existingCount = await this.prisma.roomImage.count({
      where: { roomTypeId },
    });
    return this.prisma.roomImage.create({
      data: {
        roomTypeId,
        imageUrl,
        isCover: existingCount === 0,
        sortOrder: existingCount,
      },
    });
  }

  async setCoverImage(imageId: number): Promise<void> {
    const image = await this.prisma.roomImage.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new NotFoundException('Gambar tidak ditemukan');
    await this.prisma.$transaction([
      this.prisma.roomImage.updateMany({
        where: { roomTypeId: image.roomTypeId },
        data: { isCover: false },
      }),
      this.prisma.roomImage.update({
        where: { id: imageId },
        data: { isCover: true },
      }),
    ]);
  }

  async removeImage(imageId: number): Promise<void> {
    const image = await this.prisma.roomImage.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new NotFoundException('Gambar tidak ditemukan');
    await this.prisma.roomImage.delete({ where: { id: imageId } });

    if (image.isCover) {
      const next = await this.prisma.roomImage.findFirst({
        where: { roomTypeId: image.roomTypeId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await this.prisma.roomImage.update({
          where: { id: next.id },
          data: { isCover: true },
        });
      }
    }
  }

  // ── Ketersediaan (§4.8 PROJECT.md — satu fungsi reusable, dipakai FASE 7) ──

  /**
   * `totalUnits` dipakai sebagai kapasitas acuan — form CMS admin cuma edit
   * satu angka jumlah unit, bukan daftar kode unit satu-satu. Reservation tidak
   * menunjuk unit fisik tertentu, jadi perbandingannya di level qty per
   * tipe.
   */
  async checkAvailability(
    roomTypeId: number,
    checkIn: Date,
    checkOut: Date,
    excludeReservationId?: number,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const roomType = await client.roomType.findFirst({
      where: { id: roomTypeId, deletedAt: null },
    });
    if (!roomType) {
      throw new NotFoundException(`Room type ${roomTypeId} tidak ditemukan`);
    }

    const overlapping = await client.reservationItem.findMany({
      where: {
        roomTypeId,
        reservation: {
          status: { not: ReservationStatus.HANGUS },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
          ...(excludeReservationId
            ? { id: { not: excludeReservationId } }
            : {}),
        },
      },
      select: { qty: true },
    });

    const bookedQty = overlapping.reduce((sum, item) => sum + item.qty, 0);
    const availableUnits = Math.max(0, roomType.totalUnits - bookedQty);

    return {
      roomTypeId,
      totalUnits: roomType.totalUnits,
      bookedQty,
      availableUnits,
      isAvailable: availableUnits > 0,
    };
  }

  // ── Tarif (§4.5 — fungsi pilih tarif weekday/weekend, reusable) ──

  calcStayTotal(
    roomType: {
      priceWeekday: Prisma.Decimal | number;
      priceWeekend: Prisma.Decimal | number;
    },
    checkIn: Date,
    checkOut: Date,
  ): number {
    return calcStayPrice(
      {
        priceWeekday: Number(roomType.priceWeekday),
        priceWeekend: Number(roomType.priceWeekend),
      },
      checkIn,
      checkOut,
    );
  }

  // ── Mappers ──

  private pickTranslation(
    translations: RoomTypeWithRelations['translations'],
    lang: PublicLang,
  ) {
    return (
      translations.find((t) => t.languageCode === lang) ??
      translations.find((t) => t.languageCode === LanguageCode.ID) ??
      translations[0]
    );
  }

  private pickFacilities(facilities: Prisma.JsonValue, lang: PublicLang) {
    const list = (facilities as unknown as FacilityJson[]) ?? [];
    return list.map((f) => ({
      icon: f.icon,
      label: (lang === 'EN' ? f.label.en : undefined) ?? f.label.id,
    }));
  }

  private toAdminListItem(rt: RoomTypeWithRelations) {
    const t = this.pickTranslation(rt.translations, 'ID');
    const cover = rt.images.find((i) => i.isCover) ?? rt.images[0];
    return {
      id: rt.id,
      slug: rt.slug,
      name: t?.name ?? rt.slug,
      category: t?.category ?? '',
      priceWeekday: Number(rt.priceWeekday),
      priceWeekend: Number(rt.priceWeekend),
      capacity: rt.capacity,
      totalUnits: rt.totalUnits,
      extraBedPrice:
        rt.extraBedPrice !== null ? Number(rt.extraBedPrice) : null,
      extraNoBedPrice:
        rt.extraNoBedPrice !== null ? Number(rt.extraNoBedPrice) : null,
      extraFlatPrice:
        rt.extraFlatPrice !== null ? Number(rt.extraFlatPrice) : null,
      isActive: rt.isActive,
      coverImageUrl: cover?.imageUrl ?? null,
    };
  }

  private toPublicSummary(rt: RoomTypeWithRelations, lang: PublicLang) {
    const t = this.pickTranslation(rt.translations, lang);
    const cover = rt.images.find((i) => i.isCover) ?? rt.images[0];
    return {
      slug: rt.slug,
      name: t.name,
      category: t.category,
      tagline: t.tagline,
      priceWeekday: Number(rt.priceWeekday),
      priceWeekend: Number(rt.priceWeekend),
      capacity: rt.capacity,
      coverImageUrl: cover?.imageUrl ?? null,
      // Already fetched as part of the row — free to include, no extra query.
      // Catalog cards show a few facility chips (RoomCard.tsx, listing variant).
      facilities: this.pickFacilities(rt.facilities, lang),
    };
  }

  private toPublicDetail(rt: RoomTypeWithRelations, lang: PublicLang) {
    const t = this.pickTranslation(rt.translations, lang);
    return {
      slug: rt.slug,
      name: t.name,
      category: t.category,
      tagline: t.tagline,
      description: t.description,
      bedInfo: t.bedInfo,
      bathroomInfo: t.bathroomInfo,
      rules: t.rules,
      priceWeekday: Number(rt.priceWeekday),
      priceWeekend: Number(rt.priceWeekend),
      capacity: rt.capacity,
      totalUnits: rt.totalUnits,
      extraBedPrice: rt.extraBedPrice ? Number(rt.extraBedPrice) : null,
      extraNoBedPrice: rt.extraNoBedPrice ? Number(rt.extraNoBedPrice) : null,
      extraFlatPrice: rt.extraFlatPrice ? Number(rt.extraFlatPrice) : null,
      facilities: this.pickFacilities(rt.facilities, lang),
      images: rt.images.map((i) => ({ url: i.imageUrl, isCover: i.isCover })),
    };
  }
}
