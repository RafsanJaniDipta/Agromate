-- Success stories (farmer reviews shown on the home page).
-- Additive only: the shared database also holds chat tables from the sondip_db
-- branch, which a plain diff would drop, so those statements are left out.

-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "success_story" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "nameBn" VARCHAR(40),
    "nameEn" VARCHAR(40),
    "roleBn" VARCHAR(30),
    "roleEn" VARCHAR(30),
    "locationBn" VARCHAR(30),
    "locationEn" VARCHAR(30),
    "quoteBn" VARCHAR(200),
    "quoteEn" VARCHAR(200),
    "imageUrl" TEXT NOT NULL,
    "imageKey" TEXT NOT NULL,
    "imageFocus" TEXT NOT NULL DEFAULT '50% 50%',
    "yieldChangePercent" INTEGER NOT NULL,
    "costChangePercent" INTEGER NOT NULL,
    "incomeChangePercent" INTEGER NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "status" "StoryStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "success_story_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "success_story_status_isFeatured_sortOrder_idx" ON "success_story"("status", "isFeatured", "sortOrder");

-- CreateIndex
CREATE INDEX "success_story_userId_idx" ON "success_story"("userId");

-- AddForeignKey
ALTER TABLE "success_story" ADD CONSTRAINT "success_story_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
