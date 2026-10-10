-- These changes were made on the database without a migration (db push); this records them in migration history

-- Crop plan was removed from the app
DROP TABLE IF EXISTS "crop_task_template";
DROP TABLE IF EXISTS "crop_milestone_template";
DROP TABLE IF EXISTS "growth_task";
ALTER TABLE "crop" DROP COLUMN IF EXISTS "plan_duration_days",
DROP COLUMN IF EXISTS "plan_duration_label";

-- Links an expert to the categories they advise on
CREATE TABLE "expert_profile_category" (
    "expertProfileId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,

    CONSTRAINT "expert_profile_category_pkey" PRIMARY KEY ("expertProfileId","categoryId")
);

ALTER TABLE "expert_profile_category" ADD CONSTRAINT "expert_profile_category_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "expert_category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expert_profile_category" ADD CONSTRAINT "expert_profile_category_expertProfileId_fkey" FOREIGN KEY ("expertProfileId") REFERENCES "expert_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
