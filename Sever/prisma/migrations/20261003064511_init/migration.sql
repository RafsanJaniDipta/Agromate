-- CreateEnum
CREATE TYPE "Role" AS ENUM ('FARMER', 'EXPERT', 'ADMIN');

-- CreateEnum
CREATE TYPE "CropCycleStatus" AS ENUM ('PLANTED', 'GROWING', 'HARVESTED', 'FAILED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SEEDS', 'FERTILIZER', 'PESTICIDE', 'LABOR', 'EQUIPMENT', 'IRRIGATION', 'TRANSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "QuestionStatus" AS ENUM ('OPEN', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'SUCCESS', 'ALERT');

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'FARMER';

-- CreateTable
CREATE TABLE "farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "areaInAcres" DOUBLE PRECISION NOT NULL,
    "soilType" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "areaInAcres" DOUBLE PRECISION NOT NULL,
    "soilType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "idealSoil" TEXT,
    "optimalTemp" DOUBLE PRECISION,
    "optimalRainfall" DOUBLE PRECISION,
    "durationDays" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_cycle" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedHarvestDate" TIMESTAMP(3),
    "actualHarvestDate" TIMESTAMP(3),
    "status" "CropCycleStatus" NOT NULL DEFAULT 'PLANTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_cycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest" (
    "id" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "harvestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "pricePerUnit" DOUBLE PRECISION,
    "totalRevenue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_price" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'KG',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disease_detection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "detectedDisease" TEXT NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disease_detection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fertilizer_recommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "farmId" TEXT,
    "cropName" TEXT NOT NULL,
    "soilN" DOUBLE PRECISION,
    "soilP" DOUBLE PRECISION,
    "soilK" DOUBLE PRECISION,
    "recommendedN" DOUBLE PRECISION NOT NULL,
    "recommendedP" DOUBLE PRECISION NOT NULL,
    "recommendedK" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fertilizer_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_recommendation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "soilType" TEXT NOT NULL,
    "season" TEXT,
    "recommendedCrops" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_recommendation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "question" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT,
    "imageUrl" TEXT,
    "status" "QuestionStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "answer" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isExpertAnswer" BOOLEAN NOT NULL DEFAULT false,
    "isAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expert_profile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "specialization" TEXT NOT NULL,
    "organization" TEXT,
    "experienceYears" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "rating" DOUBLE PRECISION DEFAULT 5.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expert_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "farm_userId_idx" ON "farm"("userId");

-- CreateIndex
CREATE INDEX "field_farmId_idx" ON "field"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "crop_name_key" ON "crop"("name");

-- CreateIndex
CREATE INDEX "crop_cycle_fieldId_idx" ON "crop_cycle"("fieldId");

-- CreateIndex
CREATE INDEX "crop_cycle_cropId_idx" ON "crop_cycle"("cropId");

-- CreateIndex
CREATE INDEX "expense_farmId_idx" ON "expense"("farmId");

-- CreateIndex
CREATE INDEX "expense_cropCycleId_idx" ON "expense"("cropCycleId");

-- CreateIndex
CREATE INDEX "harvest_cropCycleId_idx" ON "harvest"("cropCycleId");

-- CreateIndex
CREATE INDEX "market_price_cropName_idx" ON "market_price"("cropName");

-- CreateIndex
CREATE INDEX "market_price_location_idx" ON "market_price"("location");

-- CreateIndex
CREATE INDEX "disease_detection_userId_idx" ON "disease_detection"("userId");

-- CreateIndex
CREATE INDEX "fertilizer_recommendation_userId_idx" ON "fertilizer_recommendation"("userId");

-- CreateIndex
CREATE INDEX "fertilizer_recommendation_farmId_idx" ON "fertilizer_recommendation"("farmId");

-- CreateIndex
CREATE INDEX "crop_recommendation_userId_idx" ON "crop_recommendation"("userId");

-- CreateIndex
CREATE INDEX "question_userId_idx" ON "question"("userId");

-- CreateIndex
CREATE INDEX "answer_questionId_idx" ON "answer"("questionId");

-- CreateIndex
CREATE INDEX "answer_userId_idx" ON "answer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "expert_profile_userId_key" ON "expert_profile"("userId");

-- CreateIndex
CREATE INDEX "notification_userId_idx" ON "notification"("userId");

-- AddForeignKey
ALTER TABLE "farm" ADD CONSTRAINT "farm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field" ADD CONSTRAINT "field_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycle" ADD CONSTRAINT "crop_cycle_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycle" ADD CONSTRAINT "crop_cycle_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest" ADD CONSTRAINT "harvest_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disease_detection" ADD CONSTRAINT "disease_detection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizer_recommendation" ADD CONSTRAINT "fertilizer_recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizer_recommendation" ADD CONSTRAINT "fertilizer_recommendation_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_recommendation" ADD CONSTRAINT "crop_recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_profile" ADD CONSTRAINT "expert_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
