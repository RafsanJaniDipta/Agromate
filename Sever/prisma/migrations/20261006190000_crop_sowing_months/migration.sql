-- The crop month fields now mean planting time (when it can be sown or transplanted),
-- not the whole growing season, so farmers can filter by "what can I plant now".
-- Only this branch reads these columns, so renaming them is safe on the shared database.

-- AlterTable
ALTER TABLE "crop" RENAME COLUMN "season_start_month" TO "sowing_start_month";
ALTER TABLE "crop" RENAME COLUMN "season_end_month" TO "sowing_end_month";

-- Planting months for the starter crops (same values as prisma/seed.ts).
-- Other crops keep their old values until an admin corrects them.
UPDATE "crop" SET "sowing_start_month" = 11, "sowing_end_month" = 12 WHERE "name" IN ('Rice (Boro)', 'Wheat', 'Potato');
UPDATE "crop" SET "sowing_start_month" = 10, "sowing_end_month" = 11 WHERE "name" IN ('Tomato', 'Mustard');
UPDATE "crop" SET "sowing_start_month" = 3, "sowing_end_month" = 5 WHERE "name" = 'Jute';
