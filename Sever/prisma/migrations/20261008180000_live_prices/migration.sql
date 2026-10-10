-- Live prices: crops (TCB, daily), fertilizer (government rates) and pesticides (admin MRP),
-- plus what farmers report paying. New tables only.

CREATE TYPE "PriceCategory" AS ENUM ('CROP', 'FERTILIZER', 'PESTICIDE');
CREATE TYPE "PriceSource" AS ENUM ('TCB', 'GOVERNMENT', 'ADMIN');
CREATE TABLE "price_item" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "category" "PriceCategory" NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "unit_bn" TEXT NOT NULL,
    "unit_en" TEXT NOT NULL,
    "details" TEXT,
    "cropId" UUID,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "price_item_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "price_record" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "district" TEXT NOT NULL,
    "min_price" DOUBLE PRECISION NOT NULL,
    "max_price" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "source" "PriceSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "price_record_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "price_report" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "district" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "price_report_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "price_item_slug_key" ON "price_item"("slug");
CREATE INDEX "price_item_category_is_active_idx" ON "price_item"("category", "is_active");
CREATE INDEX "price_record_itemId_date_idx" ON "price_record"("itemId", "date");
CREATE UNIQUE INDEX "price_record_itemId_district_date_source_key" ON "price_record"("itemId", "district", "date", "source");
CREATE INDEX "price_report_itemId_district_date_idx" ON "price_report"("itemId", "district", "date");
CREATE UNIQUE INDEX "price_report_itemId_userId_date_key" ON "price_report"("itemId", "userId", "date");
ALTER TABLE "price_item" ADD CONSTRAINT "price_item_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "price_record" ADD CONSTRAINT "price_record_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "price_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_report" ADD CONSTRAINT "price_report_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "price_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "price_report" ADD CONSTRAINT "price_report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
