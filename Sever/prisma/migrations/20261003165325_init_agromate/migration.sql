/*
  Warnings:

  - The primary key for the `account` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `answer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `crop` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `crop_cycle` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `crop_recommendation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `disease_detection` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `expense` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `cropCycleId` column on the `expense` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `expert_profile` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `farm` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `fertilizer_recommendation` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `farmId` column on the `fertilizer_recommendation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `field` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `harvest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `market_price` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `notification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `question` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `impersonatedBy` column on the `session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `user` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `verification` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `id` on the `account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `account` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `answer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `questionId` on the `answer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `answer` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `crop` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `crop_cycle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `fieldId` on the `crop_cycle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cropId` on the `crop_cycle` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `crop_recommendation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `crop_recommendation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `disease_detection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `disease_detection` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `expense` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `farmId` on the `expense` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `expert_profile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `expert_profile` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `farm` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `farm` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `fertilizer_recommendation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `fertilizer_recommendation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `field` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `farmId` on the `field` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `harvest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `cropCycleId` on the `harvest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `market_price` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `notification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `question` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `question` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `userId` on the `session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `user` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `id` on the `verification` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ExpertStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterEnum
ALTER TYPE "CropCycleStatus" ADD VALUE 'PLANNED';

-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "answer" DROP CONSTRAINT "answer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "answer" DROP CONSTRAINT "answer_userId_fkey";

-- DropForeignKey
ALTER TABLE "crop_cycle" DROP CONSTRAINT "crop_cycle_cropId_fkey";

-- DropForeignKey
ALTER TABLE "crop_cycle" DROP CONSTRAINT "crop_cycle_fieldId_fkey";

-- DropForeignKey
ALTER TABLE "crop_recommendation" DROP CONSTRAINT "crop_recommendation_userId_fkey";

-- DropForeignKey
ALTER TABLE "disease_detection" DROP CONSTRAINT "disease_detection_userId_fkey";

-- DropForeignKey
ALTER TABLE "expense" DROP CONSTRAINT "expense_cropCycleId_fkey";

-- DropForeignKey
ALTER TABLE "expense" DROP CONSTRAINT "expense_farmId_fkey";

-- DropForeignKey
ALTER TABLE "expert_profile" DROP CONSTRAINT "expert_profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "farm" DROP CONSTRAINT "farm_userId_fkey";

-- DropForeignKey
ALTER TABLE "fertilizer_recommendation" DROP CONSTRAINT "fertilizer_recommendation_farmId_fkey";

-- DropForeignKey
ALTER TABLE "fertilizer_recommendation" DROP CONSTRAINT "fertilizer_recommendation_userId_fkey";

-- DropForeignKey
ALTER TABLE "field" DROP CONSTRAINT "field_farmId_fkey";

-- DropForeignKey
ALTER TABLE "harvest" DROP CONSTRAINT "harvest_cropCycleId_fkey";

-- DropForeignKey
ALTER TABLE "notification" DROP CONSTRAINT "notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "question" DROP CONSTRAINT "question_userId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropIndex
DROP INDEX "market_price_location_idx";

-- AlterTable
ALTER TABLE "account" DROP CONSTRAINT "account_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "answer" DROP CONSTRAINT "answer_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "questionId",
ADD COLUMN     "questionId" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "answer_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "crop" DROP CONSTRAINT "crop_pkey",
ADD COLUMN     "growthDays" INTEGER,
ADD COLUMN     "season" TEXT,
ADD COLUMN     "soilTypes" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "crop_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "crop_cycle" DROP CONSTRAINT "crop_cycle_pkey",
ADD COLUMN     "growthStage" TEXT,
ADD COLUMN     "plantingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "fieldId",
ADD COLUMN     "fieldId" UUID NOT NULL,
DROP COLUMN "cropId",
ADD COLUMN     "cropId" UUID NOT NULL,
ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "status" SET DEFAULT 'PLANNED',
ADD CONSTRAINT "crop_cycle_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "crop_recommendation" DROP CONSTRAINT "crop_recommendation_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "crop_recommendation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "disease_detection" DROP CONSTRAINT "disease_detection_pkey",
ADD COLUMN     "confidence" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "cropCycleId" UUID,
ADD COLUMN     "disease" TEXT,
ADD COLUMN     "severity" TEXT,
ADD COLUMN     "symptoms" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ALTER COLUMN "detectedDisease" SET DEFAULT 'Unknown',
ALTER COLUMN "confidenceScore" SET DEFAULT 0,
ADD CONSTRAINT "disease_detection_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "expense" DROP CONSTRAINT "expense_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "farmId",
ADD COLUMN     "farmId" UUID NOT NULL,
DROP COLUMN "cropCycleId",
ADD COLUMN     "cropCycleId" UUID,
ADD CONSTRAINT "expense_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "expert_profile" DROP CONSTRAINT "expert_profile_pkey",
ADD COLUMN     "qualifications" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "status" "ExpertStatus" NOT NULL DEFAULT 'PENDING',
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "expert_profile_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "farm" DROP CONSTRAINT "farm_pkey",
ADD COLUMN     "totalArea" DOUBLE PRECISION,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "areaInAcres" DROP NOT NULL,
ALTER COLUMN "areaInAcres" SET DEFAULT 0,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "farm_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "fertilizer_recommendation" DROP CONSTRAINT "fertilizer_recommendation_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "farmId",
ADD COLUMN     "farmId" UUID,
ADD CONSTRAINT "fertilizer_recommendation_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "field" DROP CONSTRAINT "field_pkey",
ADD COLUMN     "area" DOUBLE PRECISION,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "farmId",
ADD COLUMN     "farmId" UUID NOT NULL,
ALTER COLUMN "areaInAcres" DROP NOT NULL,
ALTER COLUMN "areaInAcres" SET DEFAULT 0,
ADD CONSTRAINT "field_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "harvest" DROP CONSTRAINT "harvest_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "cropCycleId",
ADD COLUMN     "cropCycleId" UUID NOT NULL,
ADD CONSTRAINT "harvest_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "market_price" DROP CONSTRAINT "market_price_pkey",
ADD COLUMN     "cropId" UUID,
ADD COLUMN     "district" TEXT NOT NULL DEFAULT 'General',
ADD COLUMN     "price" DOUBLE PRECISION DEFAULT 0,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ALTER COLUMN "location" SET DEFAULT 'General',
ALTER COLUMN "pricePerUnit" SET DEFAULT 0,
ADD CONSTRAINT "market_price_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "notification" DROP CONSTRAINT "notification_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "notification_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "question" DROP CONSTRAINT "question_pkey",
ADD COLUMN     "cropId" UUID,
ADD COLUMN     "description" TEXT,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "question_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "session" DROP CONSTRAINT "session_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "userId",
ADD COLUMN     "userId" UUID NOT NULL,
DROP COLUMN "impersonatedBy",
ADD COLUMN     "impersonatedBy" UUID,
ADD CONSTRAINT "session_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "user" DROP CONSTRAINT "user_pkey",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "language" TEXT DEFAULT 'en',
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "verification" DROP CONSTRAINT "verification_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
ADD CONSTRAINT "verification_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "reminder" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cropCycleId" UUID,
    "title" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversation" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "cropCycleId" UUID,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_message" (
    "id" UUID NOT NULL,
    "conversationId" UUID NOT NULL,
    "sender" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminder_userId_idx" ON "reminder"("userId");

-- CreateIndex
CREATE INDEX "reminder_cropCycleId_idx" ON "reminder"("cropCycleId");

-- CreateIndex
CREATE INDEX "ai_conversation_userId_idx" ON "ai_conversation"("userId");

-- CreateIndex
CREATE INDEX "ai_message_conversationId_idx" ON "ai_message"("conversationId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "answer_questionId_idx" ON "answer"("questionId");

-- CreateIndex
CREATE INDEX "answer_userId_idx" ON "answer"("userId");

-- CreateIndex
CREATE INDEX "crop_cycle_fieldId_idx" ON "crop_cycle"("fieldId");

-- CreateIndex
CREATE INDEX "crop_cycle_cropId_idx" ON "crop_cycle"("cropId");

-- CreateIndex
CREATE INDEX "crop_recommendation_userId_idx" ON "crop_recommendation"("userId");

-- CreateIndex
CREATE INDEX "disease_detection_userId_idx" ON "disease_detection"("userId");

-- CreateIndex
CREATE INDEX "disease_detection_cropCycleId_idx" ON "disease_detection"("cropCycleId");

-- CreateIndex
CREATE INDEX "expense_farmId_idx" ON "expense"("farmId");

-- CreateIndex
CREATE INDEX "expense_cropCycleId_idx" ON "expense"("cropCycleId");

-- CreateIndex
CREATE UNIQUE INDEX "expert_profile_userId_key" ON "expert_profile"("userId");

-- CreateIndex
CREATE INDEX "farm_userId_idx" ON "farm"("userId");

-- CreateIndex
CREATE INDEX "fertilizer_recommendation_userId_idx" ON "fertilizer_recommendation"("userId");

-- CreateIndex
CREATE INDEX "fertilizer_recommendation_farmId_idx" ON "fertilizer_recommendation"("farmId");

-- CreateIndex
CREATE INDEX "field_farmId_idx" ON "field"("farmId");

-- CreateIndex
CREATE INDEX "harvest_cropCycleId_idx" ON "harvest"("cropCycleId");

-- CreateIndex
CREATE INDEX "market_price_district_idx" ON "market_price"("district");

-- CreateIndex
CREATE INDEX "notification_userId_idx" ON "notification"("userId");

-- CreateIndex
CREATE INDEX "question_userId_idx" ON "question"("userId");

-- CreateIndex
CREATE INDEX "question_cropId_idx" ON "question"("cropId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farm" ADD CONSTRAINT "farm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field" ADD CONSTRAINT "field_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycle" ADD CONSTRAINT "crop_cycle_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "field"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycle" ADD CONSTRAINT "crop_cycle_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense" ADD CONSTRAINT "expense_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest" ADD CONSTRAINT "harvest_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disease_detection" ADD CONSTRAINT "disease_detection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disease_detection" ADD CONSTRAINT "disease_detection_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizer_recommendation" ADD CONSTRAINT "fertilizer_recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fertilizer_recommendation" ADD CONSTRAINT "fertilizer_recommendation_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_recommendation" ADD CONSTRAINT "crop_recommendation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversation" ADD CONSTRAINT "ai_conversation_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_message" ADD CONSTRAINT "ai_message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question" ADD CONSTRAINT "question_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer" ADD CONSTRAINT "answer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expert_profile" ADD CONSTRAINT "expert_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
