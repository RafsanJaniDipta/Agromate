-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('USER', 'ASSISTANT');

-- DropForeignKey
ALTER TABLE "crop_cycle" DROP CONSTRAINT "crop_cycle_cropId_fkey";

-- DropIndex
DROP INDEX "market_price_cropName_idx";

-- AlterTable
ALTER TABLE "ai_message" DROP COLUMN "sender",
ADD COLUMN     "sender" "MessageSender" NOT NULL;

-- AlterTable
ALTER TABLE "answer" DROP COLUMN "isAccepted",
DROP COLUMN "isExpertAnswer";

-- AlterTable
ALTER TABLE "crop" DROP COLUMN "growthDays",
DROP COLUMN "soilTypes",
ADD COLUMN     "description_bn" TEXT,
ADD COLUMN     "name_bn" TEXT;

-- AlterTable
ALTER TABLE "crop_cycle" DROP COLUMN "startDate";

-- AlterTable
ALTER TABLE "disease_detection" DROP COLUMN "confidence",
DROP COLUMN "disease";

-- AlterTable
ALTER TABLE "expert_profile" DROP COLUMN "rating";

-- AlterTable
ALTER TABLE "farm" DROP COLUMN "totalArea";

-- AlterTable
ALTER TABLE "field" DROP COLUMN "area";

-- AlterTable
ALTER TABLE "harvest" DROP COLUMN "totalRevenue",
ALTER COLUMN "pricePerUnit" SET NOT NULL;

-- AlterTable
ALTER TABLE "market_price" DROP COLUMN "cropName",
DROP COLUMN "location",
DROP COLUMN "price",
ALTER COLUMN "cropId" SET NOT NULL;

-- AlterTable
ALTER TABLE "notification" ADD COLUMN     "referenceId" UUID;

-- AlterTable
ALTER TABLE "question" DROP COLUMN "category",
DROP COLUMN "content";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "isActive",
ADD COLUMN     "locale" TEXT DEFAULT 'bn',
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "phone_number_verified" BOOLEAN DEFAULT false,
ALTER COLUMN "role" SET NOT NULL;

-- DropEnum
DROP TYPE "Role";

-- CreateTable
CREATE TABLE "guide" (
    "id" UUID NOT NULL,
    "title_en" TEXT NOT NULL,
    "title_bn" TEXT,
    "body_en" TEXT NOT NULL,
    "body_bn" TEXT,
    "crop" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_ticket" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'bn',
    "userId" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_task" (
    "id" UUID NOT NULL,
    "cropCycleId" UUID NOT NULL,
    "milestone" TEXT NOT NULL,
    "milestoneBn" TEXT,
    "title" TEXT NOT NULL,
    "titleBn" TEXT,
    "description" TEXT,
    "suggestedDay" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3),
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "growth_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_category" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name_bn" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "growth_task_cropCycleId_idx" ON "growth_task"("cropCycleId");

-- CreateIndex
CREATE UNIQUE INDEX "expert_category_slug_key" ON "expert_category"("slug");

-- CreateIndex
CREATE INDEX "expert_profile_status_idx" ON "expert_profile"("status");

-- CreateIndex
CREATE INDEX "market_price_cropId_idx" ON "market_price"("cropId");

-- CreateIndex
CREATE UNIQUE INDEX "market_price_cropId_district_date_key" ON "market_price"("cropId", "district", "date");

-- CreateIndex
CREATE INDEX "notification_userId_isRead_idx" ON "notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "question_status_idx" ON "question"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_phone_number_key" ON "user"("phone_number");

-- AddForeignKey
ALTER TABLE "support_ticket" ADD CONSTRAINT "support_ticket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycle" ADD CONSTRAINT "crop_cycle_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crop"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_task" ADD CONSTRAINT "growth_task_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_price" ADD CONSTRAINT "market_price_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;
