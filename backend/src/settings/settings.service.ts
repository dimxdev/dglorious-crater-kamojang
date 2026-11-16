import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Flat `{key: value}` object — simplest shape for the public site to
   * consume (jam operasional, no. WA, rekening, S&K). §4.6/§8.3 PROJECT.md:
   * these are the values that must never be hardcoded in the frontend.
   */
  async findAllPublic(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany();
    return Object.fromEntries(rows.map((s) => [s.key, s.value]));
  }

  /**
   * Update massal untuk Super Admin. Hanya key yang sudah ada (key baru
   * dibuat lewat seed, bukan lewat UI) — key asing ditolak 400 dan tidak
   * ada yang tersimpan sebagian karena semuanya dalam satu transaksi.
   */
  async updateMany(values: Record<string, unknown>) {
    const entries = Object.entries(values);
    for (const [key, val] of entries) {
      if (typeof val !== 'string') {
        throw new BadRequestException(`Nilai "${key}" harus berupa teks`);
      }
      if (val.length > 20000) {
        throw new BadRequestException(`Nilai "${key}" maksimal 20000 karakter`);
      }
    }

    const existing = await this.prisma.setting.findMany({
      where: { key: { in: entries.map(([k]) => k) } },
      select: { key: true },
    });
    const known = new Set(existing.map((s) => s.key));
    const unknown = entries.map(([k]) => k).filter((k) => !known.has(k));
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Pengaturan tidak dikenal: ${unknown.join(', ')}`,
      );
    }

    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.setting.update({
          where: { key },
          data: { value: value as string },
        }),
      ),
    );
    return this.findAllPublic();
  }
}
