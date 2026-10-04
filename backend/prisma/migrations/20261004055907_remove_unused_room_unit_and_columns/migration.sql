
-- DropForeignKey
ALTER TABLE "booking_items" DROP CONSTRAINT "booking_items_room_unit_id_fkey";

-- DropForeignKey
ALTER TABLE "room_units" DROP CONSTRAINT "room_units_room_type_id_fkey";

-- DropForeignKey
ALTER TABLE "settings" DROP CONSTRAINT "settings_updated_by_fkey";

-- AlterTable
ALTER TABLE "booking_items" DROP COLUMN "room_unit_id";

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "guest_email";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "proof_url";

-- AlterTable
ALTER TABLE "room_type_translations" DROP COLUMN "facilities_text";

-- AlterTable
ALTER TABLE "settings" DROP COLUMN "updated_by";

-- DropTable
DROP TABLE "room_units";

-- DropEnum
DROP TYPE "RoomUnitStatus";

