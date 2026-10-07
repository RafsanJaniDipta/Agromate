"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMonthRangeLabel } from "@/components/dashboard/crops/useMonthRangeLabel";
import FormRow from "@/components/dashboard/FormRow";
import { darkInput, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { createCropCycle, todayDateInput, type CropCycle, type CropCycleStatus } from "@/lib/cropCycles";
import { cropName, plantingFit, type Crop, type PlantingFit } from "@/lib/crops";
import type { Farm } from "@/lib/farms";
import { monthKey } from "@/lib/months";

// A new crop is either still planned or already in the ground
const startStatuses: CropCycleStatus[] = ["PLANNED", "PLANTED", "GROWING"];

// Crop list groups, in the order shown: what suits the planting month comes first
const fitGroups: PlantingFit[] = ["inSeason", "otherSeason", "unknown"];

type NewCropCycleFormProps = {
  farms: Farm[];
  crops: Crop[];
  onSaved: (cycle: CropCycle) => void;
  onCancel: () => void;
};

// Form to plant a crop from the catalog on one of the farmer's fields.
export default function NewCropCycleForm({ farms, crops, onSaved, onCancel }: NewCropCycleFormProps) {
  const t = useTranslations("dashboard.myCropsPage");
  const locale = useLocale();
  const tMonth = useTranslations("months");
  const monthRangeLabel = useMonthRangeLabel();
  const [cropId, setCropId] = useState("");
  // Controlled, so the crop list can follow the planting month
  const [plantingDate, setPlantingDate] = useState(todayDateInput);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  // "2026-10-07" → 10; falls back to this month while the date box is being cleared
  const plantingMonth = Number(plantingDate.slice(5, 7)) || new Date().getMonth() + 1;
  const plantingMonthName = tMonth(monthKey(plantingMonth));

  const sortedCrops = [...crops].sort((a, b) => cropName(a, locale).localeCompare(cropName(b, locale), locale));
  const cropGroups = fitGroups
    .map((fit) => ({ fit, crops: sortedCrops.filter((crop) => plantingFit(crop, plantingMonth) === fit) }))
    .filter((group) => group.crops.length > 0);

  const selectedCrop = crops.find((crop) => crop.id === cropId);
  const sowingMonths = selectedCrop
    ? monthRangeLabel(selectedCrop.sowingStartMonth, selectedCrop.sowingEndMonth)
    : null;
  const isOffSeason = selectedCrop ? plantingFit(selectedCrop, plantingMonth) === "otherSeason" : false;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();

    setStatus("saving");
    try {
      const saved = await createCropCycle({
        fieldId: text("fieldId"),
        cropId: text("cropId"),
        plantingDate: text("plantingDate"),
        status: text("status") as CropCycleStatus,
        expectedHarvestDate: text("expectedHarvestDate") || undefined,
        notes: text("notes") || undefined,
      });
      onSaved(saved);
    } catch {
      setStatus("error");
    }
  }

  const isSaving = status === "saving";
  const optional = (label: string) => `${label} (${t("optional")})`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow id="cycle-field" label={t("form.field")}>
          <select id="cycle-field" name="fieldId" required defaultValue="" className={darkInput}>
            <option value="" disabled className="bg-zinc-900">
              {t("pickField")}
            </option>
            {/* Fields grouped under their farm, so two "North field"s can be told apart */}
            {farms
              .filter((farm) => farm.fields.length > 0)
              .map((farm) => (
                <optgroup key={farm.id} label={farm.name} className="bg-zinc-900">
                  {farm.fields.map((field) => (
                    <option key={field.id} value={field.id} className="bg-zinc-900">
                      {field.name}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </FormRow>

        <FormRow id="cycle-planting" label={t("form.plantingDate")}>
          <input
            id="cycle-planting"
            name="plantingDate"
            type="date"
            required
            value={plantingDate}
            onChange={(event) => setPlantingDate(event.target.value)}
            className={darkInput}
          />
        </FormRow>

        <FormRow id="cycle-crop" label={t("form.crop")}>
          <select
            id="cycle-crop"
            name="cropId"
            required
            value={cropId}
            onChange={(event) => setCropId(event.target.value)}
            aria-describedby="cycle-crop-hint"
            className={darkInput}
          >
            <option value="" disabled className="bg-zinc-900">
              {t("pickCrop")}
            </option>
            {cropGroups.map((group) => (
              <optgroup
                key={group.fit}
                label={t(`cropGroups.${group.fit}`, { month: plantingMonthName })}
                className="bg-zinc-900"
              >
                {group.crops.map((crop) => (
                  <option key={crop.id} value={crop.id} className="bg-zinc-900">
                    {cropName(crop, locale)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {/* Off-season planting is allowed (early or late sowing happens), but the farmer is told */}
          <span
            id="cycle-crop-hint"
            className={`min-h-4 text-xs ${isOffSeason ? "text-amber-200" : "text-white/50"}`}
          >
            {sowingMonths &&
              (isOffSeason
                ? t("offSeasonWarning", { months: sowingMonths, month: plantingMonthName })
                : t("sowingHint", { months: sowingMonths }))}
          </span>
        </FormRow>

        <FormRow id="cycle-status" label={t("form.status")}>
          <select id="cycle-status" name="status" defaultValue="PLANTED" className={darkInput}>
            {startStatuses.map((option) => (
              <option key={option} value={option} className="bg-zinc-900">
                {t(`statuses.${option}`)}
              </option>
            ))}
          </select>
        </FormRow>

        <FormRow id="cycle-expected" label={optional(t("form.expectedHarvestDate"))}>
          <input
            id="cycle-expected"
            name="expectedHarvestDate"
            type="date"
            aria-describedby="cycle-expected-hint"
            className={darkInput}
          />
          <span id="cycle-expected-hint" className="text-xs text-white/50">
            {t("expectedHint")}
          </span>
        </FormRow>

        <FormRow id="cycle-notes" label={optional(t("form.notes"))}>
          <textarea
            id="cycle-notes"
            name="notes"
            rows={2}
            maxLength={500}
            placeholder={t("notesPlaceholder")}
            className={`${darkInput} resize-y`}
          />
        </FormRow>
      </div>

      <p aria-live="polite" className="text-sm text-red-300">
        {status === "error" && t("saveError")}
      </p>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={isSaving} className={primaryButton}>
          {isSaving ? t("adding") : t("add")}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving} className={secondaryButton}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
