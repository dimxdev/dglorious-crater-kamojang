-- CreateEnum
CREATE TYPE "ContentCollection" AS ENUM ('ATTRACTION', 'INFO_CARD', 'ROUTE', 'FAQ', 'TICKET_PACKAGE', 'PARKING_FEE', 'GALLERY', 'FACILITY_ZONE');

-- CreateTable
CREATE TABLE "site_sections" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "site_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_items" (
    "id" SERIAL NOT NULL,
    "collection" "ContentCollection" NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "image_url" TEXT,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by" INTEGER,

    CONSTRAINT "content_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "site_sections_key_key" ON "site_sections"("key");

-- CreateIndex
CREATE INDEX "content_items_collection_sort_order_idx" ON "content_items"("collection", "sort_order");

-- AddForeignKey
ALTER TABLE "site_sections" ADD CONSTRAINT "site_sections_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
