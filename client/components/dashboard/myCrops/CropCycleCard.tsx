"use client";

import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { SproutIcon } from "@/components/icons";
import DashCard from "@/components/dashboard/DashCard";
import CropCycleStatusBadge from "@/components/dashboard/myCrops/CropCycleStatusBadge";
import EditCropCycleForm from "@/components/dashboard/myCrops/EditCropCycleForm";
import CropLedger from "@/components/dashboard/ledger/CropLedger";
import { secondaryButton } from "@/components/dashboard/formStyles";
import { deleteCropCycle, toDateInput, todayDateInput, type CropCycle } from "@/lib/cropCycles";
import { cropName } from "@/lib/crops";

const DAY_MS = 24 * 60 * 60 * 1000;
const smallButton = `${secondaryButton} px-3 py-1.5 text-xs`;

// From this many days before the expected harvest, the crop counts as "almost ready"
const HARVEST_SOON_DAYS = 7;

type HarvestStage = "growing" | "soon" | "overdue";

// Progress bar and caption colours: yellow while growing, green when nearly ready, red once late
const stageStyles: Record<HarvestStage, { bar: string; text: string }> = {
  growing: { bar: "bg-amber-300", text: "text-white/60" },
  soon: { bar: "bg-emerald-400", text: "text-emerald-200" },
  overdue: { bar: "bg-red-400", text: "text-red-300" },
};

function harvestStage(daysToHarvest: number | null): HarvestStage {
  if (daysToHarvest === null) return "growing";
  if (daysToHarvest < 0) return "overdue";
  return daysToHarvest <= HARVEST_SOON_DAYS ? "soon" : "growing";
}

// "YYYY-MM-DD" → a day count, so two dates subtract to whole days
const dayNumber = (dateInput: string) => Date.parse(dateInput) / DAY_MS;

// Calendar days from today to `iso` in the farmer's time zone; negative once it has passed.
// Counts dates, not hours, so the result doesn't jump by one between midnight and 6 AM in Dhaka (UTC+6).
const daysUntil = (iso: string) => Math.round(dayNumber(toDateInput(iso)) - dayNumber(todayDateInput()));

// How far a crop is from planting to its expected harvest, 0–100
function growthPercent(cycle: CropCycle) {
  if (!cycle.expectedHarvestDate) return null;
  const start = new Date(cycle.plantingDate).getTime();
  const total = new Date(cycle.expectedHarvestDate).getTime() - start;
  if (total <= 0) return null;
  return Math.min(100, Math.max(0, Math.round(((Date.now() - start) / total) * 100)));
}

type CropCycleCardProps = {
  cycle: CropCycle;
  // Farm name for the field, so the farmer can tell fields of different farms apart
  farmName: string | undefined;
  onSaved: (cycle: CropCycle) => void;
  onDeleted: (id: string) => void;
  onDeleteFailed: () => void;
};

// One planted crop: where and when it was planted, how close it is to harvest, and edit/delete.
export default function CropCycleCard({ cycle, farmName, onSaved, onDeleted, onDeleteFailed }: CropCycleCardProps) {
  const t = useTranslations("dashboard.myCropsPage");
  const format = useFormatter();
  const locale = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLedger, setShowLedger] = useState(false);

  const name = cropName(cycle.crop, locale);
  const formatDate = (iso: string) => format.dateTime(new Date(iso), { dateStyle: "medium" });
  const isOnField = cycle.status === "PLANTED" || cycle.status === "GROWING";
  const percent = isOnField ? growthPercent(cycle) : null;
  const daysToHarvest = isOnField && cycle.expectedHarvestDate ? daysUntil(cycle.expectedHarvestDate) : null;
  const stageStyle = stageStyles[harvestStage(daysToHarvest)];

  async function handleDelete() {
    if (!window.confirm(t("confirmDelete", { crop: name, field: cycle.field.name }))) return;

    setIsDeleting(true);
    try {
      await deleteCropCycle(cycle.id);
      onDeleted(cycle.id);
    } catch {
      setIsDeleting(false);
      onDeleteFailed();
    }
  }

  function handleSaved(saved: CropCycle) {
    setIsEditing(false);
    onSaved(saved);
  }

  // Dates worth showing for this status, in the order they happen
  const dates = [
    cycle.status === "PLANNED"
      ? t("card.plannedFor", { date: formatDate(cycle.plantingDate) })
      : t("card.planted", { date: formatDate(cycle.plantingDate) }),
    cycle.status === "HARVESTED" && cycle.actualHarvestDate
      ? t("card.harvested", { date: formatDate(cycle.actualHarvestDate) })
      : cycle.status !== "FAILED" && cycle.expectedHarvestDate
        ? t("card.expected", { date: formatDate(cycle.expectedHarvestDate) })
        : null,
  ].filter(Boolean);

  return (
    <DashCard className="flex h-full flex-col gap-4">
      <header className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/20 text-brand">
          <SproutIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold">{name}</h2>
          <p className="truncate text-sm text-white/60">
            {farmName ? t("fieldAt", { field: cycle.field.name, farm: farmName }) : cycle.field.name}
          </p>
        </div>
        <CropCycleStatusBadge status={cycle.status} />
      </header>

      {isEditing ? (
        <EditCropCycleForm cycle={cycle} onSaved={handleSaved} onCancel={() => setIsEditing(false)} />
      ) : (
        <>
          <ul className="flex flex-col gap-1 text-sm text-white/80">
            {dates.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>

          {percent !== null && (
            <div className="flex flex-col gap-1.5">
              <div
                role="progressbar"
                aria-label={t("card.progress")}
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 overflow-hidden rounded-full bg-white/10"
              >
                <div
                  className={`h-full rounded-full transition-[width] ${stageStyle.bar}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {daysToHarvest !== null && (
                <p className={`text-xs ${stageStyle.text}`}>
                  {daysToHarvest < 0
                    ? t("card.overdue", { days: -daysToHarvest })
                    : t("card.daysLeft", { days: daysToHarvest })}
                </p>
              )}
            </div>
          )}

          {cycle.notes && <p className="rounded-2xl bg-white/5 px-3 py-2 text-sm text-white/70">{cycle.notes}</p>}

          {showLedger && (
            <section className="border-t border-white/10 pt-4">
              <CropLedger cropCycleId={cycle.id} />
            </section>
          )}

          <div className="mt-auto flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowLedger((shown) => !shown)}
              aria-expanded={showLedger}
              className={smallButton}
            >
              {showLedger ? t("ledger.hide") : t("ledger.show")}
            </button>
            <button type="button" onClick={() => setIsEditing(true)} className={smallButton}>
              {t("edit")}
            </button>
            <button type="button" onClick={handleDelete} disabled={isDeleting} className={smallButton}>
              {isDeleting ? t("deleting") : t("delete")}
            </button>
          </div>
        </>
      )}
    </DashCard>
  );
}
