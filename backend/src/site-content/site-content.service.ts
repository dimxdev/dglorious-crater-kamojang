import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentCollection } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import {
  COLLECTIONS_WITH_IMAGE,
  SECTION_KEYS,
  validateImageUrl,
  validateItemContent,
  validateSection,
} from './content-schemas';
import type {
  CreateItemDto,
  ReorderItemsDto,
  UpdateItemDto,
} from './dto/site-content.dto';

const ALL_COLLECTIONS = Object.values(ContentCollection);

@Injectable()
export class SiteContentService {
  constructor(private readonly prisma: PrismaService) {}

  /** Satu payload untuk seluruh halaman publik; hanya item aktif, urut sortOrder lalu id. */
  async findAllPublic() {
    const [sections, items] = await Promise.all([
      this.prisma.siteSection.findMany(),
      this.prisma.contentItem.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
      }),
    ]);

    const collections = Object.fromEntries(
      ALL_COLLECTIONS.map((c) => [c, [] as unknown[]]),
    ) as Record<ContentCollection, unknown[]>;
    for (const it of items) {
      collections[it.collection].push({
        id: it.id,
        imageUrl: it.imageUrl,
        content: it.content,
      });
    }

    return {
      sections: Object.fromEntries(sections.map((s) => [s.key, s.content])),
      collections,
    };
  }

  async listSections() {
    const rows = await this.prisma.siteSection.findMany({
      include: { updatedBy: { select: { name: true } } },
      orderBy: { key: 'asc' },
    });
    return rows.map((r) => ({
      key: r.key,
      content: r.content,
      updatedAt: r.updatedAt,
      updatedBy: r.updatedBy ? { name: r.updatedBy.name } : null,
    }));
  }

  async updateSection(key: string, content: unknown, userId: number) {
    if (!SECTION_KEYS.includes(key)) {
      throw new NotFoundException(`Section "${key}" tidak ditemukan`);
    }
    const clean = validateSection(key, content) as object;
    const row = await this.prisma.siteSection.upsert({
      where: { key },
      create: { key, content: clean, updatedById: userId },
      update: { content: clean, updatedById: userId },
      include: { updatedBy: { select: { name: true } } },
    });
    return {
      key: row.key,
      content: row.content,
      updatedAt: row.updatedAt,
      updatedBy: row.updatedBy ? { name: row.updatedBy.name } : null,
    };
  }

  listItems(collection: ContentCollection) {
    return this.prisma.contentItem.findMany({
      where: { collection },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  async createItem(dto: CreateItemDto, userId: number) {
    const content = validateItemContent(dto.collection, dto.content) as object;
    const imageUrl = this.resolveImage(dto.collection, dto.imageUrl);

    const max = await this.prisma.contentItem.aggregate({
      where: { collection: dto.collection },
      _max: { sortOrder: true },
    });
    return this.prisma.contentItem.create({
      data: {
        collection: dto.collection,
        content,
        imageUrl: imageUrl ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: (max._max.sortOrder ?? -1) + 1,
        updatedById: userId,
      },
    });
  }

  async updateItem(id: number, dto: UpdateItemDto, userId: number) {
    const existing = await this.findItemOrThrow(id);
    const data: Record<string, unknown> = { updatedById: userId };

    if (dto.content !== undefined) {
      data.content = validateItemContent(existing.collection, dto.content);
    }
    if (dto.imageUrl !== undefined) {
      data.imageUrl = this.resolveImage(existing.collection, dto.imageUrl);
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.contentItem.update({ where: { id }, data });
  }

  async deleteItem(id: number) {
    await this.findItemOrThrow(id);
    await this.prisma.contentItem.delete({ where: { id } });
    return { success: true };
  }

  /** `ids` harus persis sama dengan seluruh item koleksi (aktif maupun nonaktif). */
  async reorder(dto: ReorderItemsDto, userId: number) {
    const rows = await this.prisma.contentItem.findMany({
      where: { collection: dto.collection },
      select: { id: true },
    });
    const existing = new Set(rows.map((r) => r.id));
    const given = new Set(dto.ids);
    if (
      given.size !== dto.ids.length ||
      given.size !== existing.size ||
      dto.ids.some((i) => !existing.has(i))
    ) {
      throw new BadRequestException(
        'ids harus memuat seluruh item koleksi ini tanpa duplikat',
      );
    }
    await this.prisma.$transaction(
      dto.ids.map((id, index) =>
        this.prisma.contentItem.update({
          where: { id },
          data: { sortOrder: index, updatedById: userId },
        }),
      ),
    );
    return this.listItems(dto.collection);
  }

  private async findItemOrThrow(id: number) {
    const item = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item tidak ditemukan');
    return item;
  }

  private resolveImage(
    collection: ContentCollection,
    value: string | null | undefined,
  ): string | null | undefined {
    if (value === undefined) return undefined;
    const url = validateImageUrl(value);
    if (url && !COLLECTIONS_WITH_IMAGE.includes(collection)) {
      throw new BadRequestException(
        `Koleksi ${collection} tidak memakai gambar`,
      );
    }
    return url;
  }
}
