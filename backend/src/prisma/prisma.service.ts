import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Single shared Prisma client for the whole app.
 *
 * Prisma 7 uses a driver adapter (pg) instead of a `url` in the schema.
 * The connection string comes from the DATABASE_URL env var.
 *
 * Note: we do NOT call $connect() on init — Prisma connects lazily on the
 * first query. This lets the server boot even before the database and
 * migrations exist (created in FASE 1).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
      }),
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
