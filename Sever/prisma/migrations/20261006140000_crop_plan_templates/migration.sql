-- AlterTable
ALTER TABLE "crop" ADD COLUMN     "plan_duration_days" INTEGER,
ADD COLUMN     "plan_duration_label" TEXT;

-- CreateTable
CREATE TABLE "crop_milestone_template" (
    "id" UUID NOT NULL,
    "cropId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "nameBn" TEXT,
    "dayStart" INTEGER NOT NULL,
    "dayEnd" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_milestone_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_task_template" (
    "id" UUID NOT NULL,
    "milestoneId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "titleBn" TEXT,
    "description" TEXT,
    "suggestedDay" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_task_template_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "crop_milestone_template_cropId_idx" ON "crop_milestone_template"("cropId");

-- CreateIndex
CREATE UNIQUE INDEX "crop_milestone_template_cropId_sortOrder_key" ON "crop_milestone_template"("cropId", "sortOrder");

-- CreateIndex
CREATE INDEX "crop_task_template_milestoneId_idx" ON "crop_task_template"("milestoneId");

-- AddForeignKey
ALTER TABLE "crop_milestone_template" ADD CONSTRAINT "crop_milestone_template_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_task_template" ADD CONSTRAINT "crop_task_template_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "crop_milestone_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
