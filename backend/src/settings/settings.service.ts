import { BadRequestException, Injectable } from '@nestjs/common';
import { normalizeIdPhone, PHONE_MESSAGE, PHONE_REGEX } from '../common/phone';
import { PrismaService } from '../prisma/prisma.service';

const MAX_VALUE = 20000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    const entries = Object.entries(values).map(
      ([key, val]) => [key, this.validateValue(key, val)] as [string, string],
    );

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
          data: { value },
        }),
      ),
    );
    return this.findAllPublic();
  }

  /** Validasi + normalisasi nilai per key; mengembalikan nilai bersih. */
  private validateValue(key: string, val: unknown): string {
    if (typeof val !== 'string') {
      throw new BadRequestException(`Nilai "${key}" harus berupa teks.`);
    }
    if (val.length > MAX_VALUE) {
      throw new BadRequestException(
        `Nilai "${key}" maksimal ${MAX_VALUE} karakter.`,
      );
    }
    const v = val.trim();

    if (key === 'whatsapp_number' || key === 'whatsapp_number_2') {
      if (v === '' && key === 'whatsapp_number_2') return '';
      const phone = normalizeIdPhone(v);
      if (typeof phone !== 'string' || !PHONE_REGEX.test(phone)) {
        throw new BadRequestException(PHONE_MESSAGE);
      }
      return phone;
    }
    if (key === 'contact_email') {
      if (v.length > 191 || !EMAIL_RE.test(v)) {
        throw new BadRequestException('Format email tidak valid.');
      }
      return v;
    }
    if (
      key === 'instagram_url' ||
      key === 'tiktok_url' ||
      key === 'facebook_url'
    ) {
      if (v === '') return '';
      if (v.length > 500 || !/^https:\/\/[^\s/]+\.[^\s]+$/i.test(v)) {
        throw new BadRequestException('Tautan harus diawali https://');
      }
      return v;
    }
    if (key === 'check_in_time' || key === 'check_out_time') {
      const m = /^([01]\d|2[0-3])[.:]([0-5]\d)$/.exec(v);
      if (!m) {
        throw new BadRequestException(
          'Jam tidak valid. Gunakan format JJ:MM (contoh: 14:00).',
        );
      }
      return `${m[1]}:${m[2]}`;
    }
    if (key.startsWith('terms_conditions_')) {
      if (v === '') {
        throw new BadRequestException('Syarat & ketentuan wajib diisi.');
      }
      return val;
    }
    return val;
  }
}
