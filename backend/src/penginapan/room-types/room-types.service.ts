import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { BookingStatus, LanguageCode } from '../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoomTypeDto } from './dto/create-room-type.dto';
import { CreateRoomUnitDto, UpdateRoomUnitDto } from './dto/room-unit.dto';
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
    await this.findOneAdminOrThrow(id);
    const { translations, facilities, ...rest } = dto;

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
    await this.prisma.roomType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
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
        units: { orderBy: { unitCode: 'asc' } },
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

  // ── Room units (bookkeeping fisik — lihat catatan di checkAvailability) ──

  async addUnit(roomTypeId: number, dto: CreateRoomUnitDto) {
    await this.findOneAdminOrThrow(roomTypeId);
    try {
      return await this.prisma.roomUnit.create({
        data: { roomTypeId, unitCode: dto.unitCode, status: dto.status },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException(
          `Kode unit "${dto.unitCode}" sudah dipakai di tipe ini`,
        );
      }
      throw e;
    }
  }

  async updateUnit(unitId: number, dto: UpdateRoomUnitDto) {
    const unit = await this.prisma.roomUnit.findUnique({
      where: { id: unitId },
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');
    return this.prisma.roomUnit.update({ where: { id: unitId }, data: dto });
  }

  async removeUnit(unitId: number): Promise<void> {
    const unit = await this.prisma.roomUnit.findUnique({
      where: { id: unitId },
    });
    if (!unit) throw new NotFoundException('Unit tidak ditemukan');
    try {
      await this.prisma.roomUnit.delete({ where: { id: unitId } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new ConflictException(
          'Unit ini masih dipakai di data booking, tidak bisa dihapus',
        );
      }
      throw e;
    }
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
   * `totalUnits` (bukan hitung baris `room_units`) dipakai sebagai kapasitas
   * acuan — form CMS admin cuma edit satu angka jumlah unit, bukan daftar
   * kode unit satu-satu, jadi `room_units` di fase 1 murni bookkeeping
   * opsional (mis. tandai unit tertentu maintenance), tidak menggerakkan
   * angka ketersediaan.
   *
   * `roomUnitId` di `booking_items` baru diisi saat check-in (§7 PROJECT.md)
   * — jadi pada saat booking DIBUAT belum ada unit spesifik untuk dicek,
   * makanya perbandingannya di level qty per tipe, bukan per unit fisik.
   */
  async checkAvailability(
    roomTypeId: number,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: number,
  ) {
    const roomType = await this.prisma.roomType.findFirst({
      where: { id: roomTypeId, deletedAt: null },
    });
    if (!roomType) {
      throw new NotFoundException(`Room type ${roomTypeId} tidak ditemukan`);
    }

    const overlapping = await this.prisma.bookingItem.findMany({
      where: {
        roomTypeId,
        booking: {
          status: { not: BookingStatus.HANGUS },
          checkIn: { lt: checkOut },
          checkOut: { gt: checkIn },
          ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
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
