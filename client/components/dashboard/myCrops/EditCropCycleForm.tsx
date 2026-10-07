"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import FormRow from "@/components/dashboard/FormRow";
import { darkInput, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import {
  CROP_CYCLE_STATUSES,
  toDateInput,
  todayDateInput,
  updateCropCycle,
  type CropCycle,
  type CropCycleStatus,
} from "@/lib/cropCycles";

type EditCropCycleFormProps = {
  cycle: CropCycle;
  onSaved: (cycle: CropCycle) => void;
  onCancel: () => void;
};

// Edits a planted crop's status, dates and notes. The field and crop stay as they are.
export default function EditCropCycleForm({ cycle, onSaved, onCancel }: EditCropCycleFormProps) {
  const t = useTranslations("dashboard.myCropsPage");
  // Controlled, so the harvest date box can appear once "Harvested" is picked
  const [cycleStatus, setCycleStatus] = useState<CropCycleStatus>(cycle.status);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const idPrefix = `cycle-${cycle.id}`;
  const isHarvested = cycleStatus === "HARVESTED";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim() || null;

    setStatus("saving");
    try {
      const saved = await updateCropCycle(cycle.id, {
        status: cycleStatus,
        plantingDate: text("plantingDate") ?? toDateInput(cycle.plantingDate),
        expectedHarvestDate: text("expectedHarvestDate"),
        // Only a harvested crop keeps a harvest date
        actualHarvestDate: isHarvested ? text("actualHarvestDate") : null,
        notes: text("notes"),
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
        <FormRow id={`${idPrefix}-status`} label={t("form.status")}>
          <select
            id={`${idPrefix}-status`}
            value={cycleStatus}
            onChange={(event) => setCycleStatus(event.target.value as CropCycleStatus)}
            className={darkInput}
          >
            {CROP_CYCLE_STATUSES.map((option) => (
              <option key={option} value={option} className="bg-zinc-900">
                {t(`statuses.${option}`)}
              </option>
            ))}
          </select>
        </FormRow>

        <FormRow id={`${idPrefix}-planting`} label={t("form.plantingDate")}>
          <input
            id={`${idPrefix}-planting`}
            name="plantingDate"
            type="date"
            required
            defaultValue={toDateInput(cycle.plantingDate)}
            className={darkInput}
          />
        </FormRow>

        <FormRow id={`${idPrefix}-expected`} label={optional(t("form.expectedHarvestDate"))}>
          <input
            id={`${idPrefix}-expected`}
            name="expectedHarvestDate"
            type="date"
            defaultValue={toDateInput(cycle.expectedHarvestDate)}
            className={darkInput}
          />
        </FormRow>

        {isHarvested && (
          <FormRow id={`${idPrefix}-actual`} label={t("form.actualHarvestDate")}>
            <input
              id={`${idPrefix}-actual`}
              name="actualHarvestDate"
              type="date"
              required
              defaultValue={toDateInput(cycle.actualHarvestDate) || todayDateInput()}
              className={darkInput}
            />
          </FormRow>
        )}

        <div className="sm:col-span-2">
          <FormRow id={`${idPrefix}-notes`} label={optional(t("form.notes"))}>
            <textarea
              id={`${idPrefix}-notes`}
              name="notes"
              rows={2}
              maxLength={500}
              defaultValue={cycle.notes ?? ""}
              placeholder={t("notesPlaceholder")}
              className={`${darkInput} resize-y`}
            />
          </FormRow>
        </div>
      </div>

      <p aria-live="polite" className="text-sm text-red-300">
        {status === "error" && t("saveError")}
      </p>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={isSaving} className={primaryButton}>
          {isSaving ? t("saving") : t("save")}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving} className={secondaryButton}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
