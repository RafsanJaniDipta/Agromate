-- Fields for saving the AI disease check (Gemini): the crop it recognised, whether the plant
-- looked healthy, and how confident it was. Additive only: other branches are unaffected.

-- AlterTable
ALTER TABLE "disease_detection" ADD COLUMN "crop_name" TEXT,
ADD COLUMN "is_healthy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "confidence_level" TEXT;
