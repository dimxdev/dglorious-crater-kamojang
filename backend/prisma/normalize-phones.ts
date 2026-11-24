/**
 * Sekali jalan, idempoten: ubah reservations.guest_phone ke format +62….
 * Jalankan: npx tsx prisma/normalize-phones.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { normalizeIdPhone, PHONE_REGEX } from '../src/common/phone';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rows = await prisma.reservation.findMany({
    select: { id: true, reservationCode: true, guestPhone: true },
  });
  let updated = 0;
  let already = 0;
  const skipped: string[] = [];
  for (const r of rows) {
    const next = normalizeIdPhone(r.guestPhone) as string;
    if (!PHONE_REGEX.test(next)) {
      skipped.push(`${r.reservationCode}: "${r.guestPhone}"`);
      continue;
    }
    if (next === r.guestPhone) {
      already++;
      continue;
    }
    await prisma.reservation.update({
      where: { id: r.id },
      data: { guestPhone: next },
    });
    updated++;
  }
  console.log(`Total ${rows.length}: diubah ${updated}, sudah kanonik ${already}, dilewati ${skipped.length}`);
  for (const s of skipped) console.log('  dilewati ->', s);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
