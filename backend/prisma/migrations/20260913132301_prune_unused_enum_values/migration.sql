
-- AlterEnum
BEGIN;
CREATE TYPE "BookingSource_new" AS ENUM ('MANUAL');
ALTER TABLE "bookings" ALTER COLUMN "booking_source" TYPE "BookingSource_new" USING ("booking_source"::text::"BookingSource_new");
ALTER TYPE "BookingSource" RENAME TO "BookingSource_old";
ALTER TYPE "BookingSource_new" RENAME TO "BookingSource";
DROP TYPE "public"."BookingSource_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'QRIS', 'BANK_TRANSFER');
ALTER TABLE "payments" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "public"."PaymentMethod_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('PENDING', 'PAID');
ALTER TABLE "public"."payments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING ("status"::text::"PaymentStatus_new");
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RoomUnitStatus_new" AS ENUM ('AVAILABLE');
ALTER TABLE "public"."room_units" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "room_units" ALTER COLUMN "status" TYPE "RoomUnitStatus_new" USING ("status"::text::"RoomUnitStatus_new");
ALTER TYPE "RoomUnitStatus" RENAME TO "RoomUnitStatus_old";
ALTER TYPE "RoomUnitStatus_new" RENAME TO "RoomUnitStatus";
DROP TYPE "public"."RoomUnitStatus_old";
ALTER TABLE "room_units" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE';
COMMIT;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "permissions";

