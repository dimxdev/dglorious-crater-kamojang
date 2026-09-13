
-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('DP', 'LUNAS', 'CHECKED_IN', 'HANGUS', 'COMPLETED', 'NO_SHOW');
ALTER TABLE "public"."bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'DP';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "LanguageCode_new" AS ENUM ('ID', 'EN');
ALTER TABLE "room_type_translations" ALTER COLUMN "language_code" TYPE "LanguageCode_new" USING ("language_code"::text::"LanguageCode_new");
ALTER TYPE "LanguageCode" RENAME TO "LanguageCode_old";
ALTER TYPE "LanguageCode_new" RENAME TO "LanguageCode";
DROP TYPE "public"."LanguageCode_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RoleName_new" AS ENUM ('SUPER_ADMIN', 'OWNER', 'ADMIN_PENGINAPAN');
ALTER TABLE "roles" ALTER COLUMN "name" TYPE "RoleName_new" USING ("name"::text::"RoleName_new");
ALTER TYPE "RoleName" RENAME TO "RoleName_old";
ALTER TYPE "RoleName_new" RENAME TO "RoleName";
DROP TYPE "public"."RoleName_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "tickets" DROP CONSTRAINT "tickets_booking_id_fkey";

-- DropIndex
DROP INDEX "payments_midtrans_order_id_key";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "expired_at";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "midtrans_order_id";

-- DropTable
DROP TABLE "tickets";

