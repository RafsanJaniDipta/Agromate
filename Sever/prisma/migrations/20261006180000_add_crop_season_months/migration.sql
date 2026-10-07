-- Crop growing season as month numbers (1 = January … 12 = December).
-- Additive only: the old free-text "season" column stays until every branch
-- on the shared database has stopped reading it.

-- AlterTable
ALTER TABLE "crop" ADD COLUMN "season_start_month" INTEGER,
ADD COLUMN "season_end_month" INTEGER;

-- Carry existing rows over from their season text
UPDATE "crop"
SET
  "season_start_month" = CASE
    WHEN "season" ILIKE '%rabi%' THEN 10
    WHEN "season" ILIKE '%kharif-1%' THEN 3
    WHEN "season" ILIKE '%kharif-2%' THEN 7
    WHEN "season" ILIKE '%kharif%' THEN 3
    WHEN "season" ILIKE '%winter%' THEN 11
    WHEN "season" ILIKE '%year-round%' THEN 1
  END,
  "season_end_month" = CASE
    WHEN "season" ILIKE '%rabi%' THEN 3
    WHEN "season" ILIKE '%kharif-1%' THEN 7
    WHEN "season" ILIKE '%kharif-2%' THEN 10
    WHEN "season" ILIKE '%kharif%' THEN 10
    WHEN "season" ILIKE '%winter%' THEN 3
    WHEN "season" ILIKE '%year-round%' THEN 12
  END;

-- The starter crops get their real months (same values as prisma/seed.ts)
UPDATE "crop" SET "season_start_month" = 12, "season_end_month" = 5 WHERE "name" = 'Rice (Boro)';
UPDATE "crop" SET "season_start_month" = 11, "season_end_month" = 3 WHERE "name" IN ('Wheat', 'Potato');
UPDATE "crop" SET "season_start_month" = 10, "season_end_month" = 3 WHERE "name" = 'Tomato';
UPDATE "crop" SET "season_start_month" = 3, "season_end_month" = 7 WHERE "name" = 'Jute';
UPDATE "crop" SET "season_start_month" = 10, "season_end_month" = 1 WHERE "name" = 'Mustard';
