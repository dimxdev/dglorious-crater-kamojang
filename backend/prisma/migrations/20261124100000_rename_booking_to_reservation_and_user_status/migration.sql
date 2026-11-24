-- Penyeragaman istilah: booking -> reservation (data dipertahankan, hanya rename).
ALTER TYPE "BookingStatus" RENAME TO "ReservationStatus";
ALTER TYPE "BookingChannel" RENAME TO "ReservationChannel";

-- reservations
ALTER TABLE "bookings" RENAME TO "reservations";
ALTER TABLE "reservations" RENAME COLUMN "booking_code" TO "reservation_code";
ALTER TABLE "reservations" RENAME COLUMN "booking_channel" TO "channel";
ALTER TABLE "reservations" DROP COLUMN "booking_source";
DROP TYPE "BookingSource";
ALTER TABLE "reservations" RENAME CONSTRAINT "bookings_pkey" TO "reservations_pkey";
ALTER TABLE "reservations" RENAME CONSTRAINT "bookings_created_by_fkey" TO "reservations_created_by_fkey";
ALTER INDEX "bookings_booking_code_key" RENAME TO "reservations_reservation_code_key";
ALTER INDEX "bookings_check_in_check_out_idx" RENAME TO "reservations_check_in_check_out_idx";
ALTER INDEX "bookings_created_at_idx" RENAME TO "reservations_created_at_idx";
ALTER INDEX "bookings_booking_channel_idx" RENAME TO "reservations_channel_idx";
ALTER INDEX "bookings_status_idx" RENAME TO "reservations_status_idx";
ALTER SEQUENCE "bookings_id_seq" RENAME TO "reservations_id_seq";

-- reservation_items
ALTER TABLE "booking_items" RENAME TO "reservation_items";
ALTER TABLE "reservation_items" RENAME COLUMN "booking_id" TO "reservation_id";
ALTER TABLE "reservation_items" RENAME CONSTRAINT "booking_items_pkey" TO "reservation_items_pkey";
ALTER TABLE "reservation_items" RENAME CONSTRAINT "booking_items_booking_id_fkey" TO "reservation_items_reservation_id_fkey";
ALTER TABLE "reservation_items" RENAME CONSTRAINT "booking_items_room_type_id_fkey" TO "reservation_items_room_type_id_fkey";
ALTER INDEX "booking_items_booking_id_idx" RENAME TO "reservation_items_reservation_id_idx";
ALTER INDEX "booking_items_room_type_id_idx" RENAME TO "reservation_items_room_type_id_idx";
ALTER SEQUENCE "booking_items_id_seq" RENAME TO "reservation_items_id_seq";

-- reservation_edit_logs
ALTER TABLE "booking_edit_logs" RENAME TO "reservation_edit_logs";
ALTER TABLE "reservation_edit_logs" RENAME COLUMN "booking_id" TO "reservation_id";
ALTER TABLE "reservation_edit_logs" RENAME CONSTRAINT "booking_edit_logs_pkey" TO "reservation_edit_logs_pkey";
ALTER TABLE "reservation_edit_logs" RENAME CONSTRAINT "booking_edit_logs_booking_id_fkey" TO "reservation_edit_logs_reservation_id_fkey";
ALTER TABLE "reservation_edit_logs" RENAME CONSTRAINT "booking_edit_logs_edited_by_id_fkey" TO "reservation_edit_logs_edited_by_id_fkey";
ALTER INDEX "booking_edit_logs_booking_id_idx" RENAME TO "reservation_edit_logs_reservation_id_idx";
ALTER SEQUENCE "booking_edit_logs_id_seq" RENAME TO "reservation_edit_logs_id_seq";

-- payments: hapus status (selalu PAID, tidak ada alur verifikasi), verified_by -> recorded_by
ALTER TABLE "payments" RENAME COLUMN "booking_id" TO "reservation_id";
ALTER TABLE "payments" RENAME COLUMN "verified_by" TO "recorded_by";
ALTER TABLE "payments" RENAME CONSTRAINT "payments_booking_id_fkey" TO "payments_reservation_id_fkey";
ALTER TABLE "payments" RENAME CONSTRAINT "payments_verified_by_fkey" TO "payments_recorded_by_fkey";
ALTER TABLE "payments" DROP COLUMN "status";
DROP TYPE "PaymentStatus";
UPDATE "payments" SET "paid_at" = "created_at" WHERE "paid_at" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "paid_at" SET NOT NULL, ALTER COLUMN "paid_at" SET DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX "payments_reservation_id_idx" ON "payments"("reservation_id");

-- users: status aktif & waktu ubah (kelola akun oleh Super Admin)
ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
