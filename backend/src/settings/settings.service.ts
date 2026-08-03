import { Injectable } from '@nestjs/common';
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
}
