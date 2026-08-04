-- Move adults/children/extra-bed fields from `bookings` (one value per whole
-- booking) to `booking_items` (per tenda) — FASE 7 decision 2026-08-02:
-- one booking can include multiple tents with different guest/extra-bed
-- composition per tent (see RoomGroupEditor.tsx on the frontend).
-- Also drops `ktp_photo_url` entirely (feature dropped, decision 2026-08-02).

-- AlterTable: bookings
ALTER TABLE "bookings" DROP COLUMN "adults";
ALTER TABLE "bookings" DROP COLUMN "children";
ALTER TABLE "bookings" DROP COLUMN "extra_bed_qty";
ALTER TABLE "bookings" DROP COLUMN "extra_bed_type";
ALTER TABLE "bookings" DROP COLUMN "extra_bed_price";
ALTER TABLE "bookings" DROP COLUMN "ktp_photo_url";

-- AlterTable: booking_items
ALTER TABLE "booking_items" ADD COLUMN "adults" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "booking_items" ADD COLUMN "children" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "booking_items" ADD COLUMN "extra_bed_qty" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "booking_items" ADD COLUMN "extra_bed_type" "ExtraBedType";
ALTER TABLE "booking_items" ADD COLUMN "extra_bed_price" DECIMAL(12,2) NOT NULL DEFAULT 0;
