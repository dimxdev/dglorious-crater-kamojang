-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'OWNER', 'ADMIN_PENGINAPAN', 'ADMIN_PORTAL', 'ADMIN_CAFFE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'WAITING_PAYMENT', 'PAID', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'EXPIRED', 'CANCELLED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('ONLINE', 'WALK_IN');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'QRIS', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'EWALLET', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "RoomUnitStatus" AS ENUM ('AVAILABLE', 'MAINTENANCE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "LanguageCode" AS ENUM ('ID', 'EN', 'ZH');

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" "RoleName" NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "role_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "price_per_night" DECIMAL(12,2) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "total_units" INTEGER NOT NULL,
    "facilities" JSONB NOT NULL DEFAULT '[]',
    "check_in_time" TEXT,
    "check_out_time" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "room_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_type_translations" (
    "id" SERIAL NOT NULL,
    "room_type_id" INTEGER NOT NULL,
    "language_code" "LanguageCode" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "facilities_text" TEXT,
    "rules" TEXT,

    CONSTRAINT "room_type_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_images" (
    "id" SERIAL NOT NULL,
    "room_type_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "room_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_units" (
    "id" SERIAL NOT NULL,
    "room_type_id" INTEGER NOT NULL,
    "unit_code" TEXT NOT NULL,
    "status" "RoomUnitStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "room_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" SERIAL NOT NULL,
    "booking_code" TEXT NOT NULL,
    "room_type_id" INTEGER NOT NULL,
    "room_unit_id" INTEGER,
    "guest_name" TEXT NOT NULL,
    "guest_phone" TEXT NOT NULL,
    "guest_email" TEXT,
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "total_guests" INTEGER NOT NULL,
    "price_snapshot" DECIMAL(12,2) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "booking_source" "BookingSource" NOT NULL,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expired_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "confirmed_at" TIMESTAMP(3),
    "checked_in_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "proof_url" TEXT,
    "midtrans_order_id" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "verified_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "qr_url" TEXT,
    "pdf_url" TEXT,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_slug_key" ON "room_types"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "room_type_translations_room_type_id_language_code_key" ON "room_type_translations"("room_type_id", "language_code");

-- CreateIndex
CREATE UNIQUE INDEX "room_units_room_type_id_unit_code_key" ON "room_units"("room_type_id", "unit_code");

-- CreateIndex
CREATE UNIQUE INDEX "bookings_booking_code_key" ON "bookings"("booking_code");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_room_type_id_idx" ON "bookings"("room_type_id");

-- CreateIndex
CREATE INDEX "bookings_check_in_check_out_idx" ON "bookings"("check_in", "check_out");

-- CreateIndex
CREATE UNIQUE INDEX "payments_midtrans_order_id_key" ON "payments"("midtrans_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_booking_id_key" ON "tickets"("booking_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_types" ADD CONSTRAINT "room_types_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_type_translations" ADD CONSTRAINT "room_type_translations_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_images" ADD CONSTRAINT "room_images_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_units" ADD CONSTRAINT "room_units_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_room_unit_id_fkey" FOREIGN KEY ("room_unit_id") REFERENCES "room_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
