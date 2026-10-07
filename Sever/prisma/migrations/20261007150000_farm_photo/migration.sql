-- Photo of each farm (place) uploaded by the farmer, stored on Cloudinary.
-- Additive only: a nullable column, so other branches on the shared database are unaffected.

-- AlterTable
ALTER TABLE "farm" ADD COLUMN "image_url" TEXT;
