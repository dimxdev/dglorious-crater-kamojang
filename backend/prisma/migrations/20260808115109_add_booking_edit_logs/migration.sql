-- CreateTable
CREATE TABLE "booking_edit_logs" (
    "id" SERIAL NOT NULL,
    "booking_id" INTEGER NOT NULL,
    "edited_by_id" INTEGER NOT NULL,
    "edited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT NOT NULL,
    "changes" JSONB NOT NULL,

    CONSTRAINT "booking_edit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "booking_edit_logs_booking_id_idx" ON "booking_edit_logs"("booking_id");

-- AddForeignKey
ALTER TABLE "booking_edit_logs" ADD CONSTRAINT "booking_edit_logs_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking_edit_logs" ADD CONSTRAINT "booking_edit_logs_edited_by_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
