/*
  Warnings:

  - The values [CONFIRMED,COMPLETED,CANCELLED] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `cancelled_at` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `completed_at` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `confirmed_at` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `paid_at` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `payment_status` on the `bookings` table. All the data in the column will be lost.
  - Added the required column `booking_channel` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `room_type_translations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BookingChannel" AS ENUM ('WHATSAPP', 'WALK_IN');

-- CreateEnum
CREATE TYPE "ExtraBedType" AS ENUM ('WITH_BED', 'WITHOUT_BED');

-- AlterEnum
BEGIN;
CREATE TYPE "BookingStatus_new" AS ENUM ('DP', 'LUNAS', 'CHECKED_IN', 'HANGUS', 'PENDING', 'WAITING_PAYMENT', 'PAID', 'EXPIRED', 'REJECTED');
ALTER TABLE "public"."bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bookings" ALTER COLUMN "status" TYPE "BookingStatus_new" USING ("status"::text::"BookingStatus_new");
ALTER TYPE "BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'DP';
COMMIT;

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "cancelled_at",
DROP COLUMN "completed_at",
DROP COLUMN "confirmed_at",
DROP COLUMN "paid_at",
DROP COLUMN "payment_status",
ADD COLUMN     "booking_channel" "BookingChannel" NOT NULL,
ADD COLUMN     "extra_bed_type" "ExtraBedType",
ADD COLUMN     "hangus_at" TIMESTAMP(3),
ADD COLUMN     "lunas_at" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'DP';

-- AlterTable
ALTER TABLE "room_type_translations" ADD COLUMN     "bathroom_info" TEXT,
ADD COLUMN     "bed_info" TEXT,
ADD COLUMN     "category" TEXT NOT NULL,
ADD COLUMN     "tagline" TEXT;

-- AlterTable
ALTER TABLE "room_types" ADD COLUMN     "extra_bed_price" DECIMAL(12,2),
ADD COLUMN     "extra_flat_price" DECIMAL(12,2),
ADD COLUMN     "extra_no_bed_price" DECIMAL(12,2);

-- DropEnum
DROP TYPE "BookingPaymentStatus";

-- CreateIndex
CREATE INDEX "bookings_created_at_idx" ON "bookings"("created_at");

-- CreateIndex
CREATE INDEX "bookings_booking_channel_idx" ON "bookings"("booking_channel");
