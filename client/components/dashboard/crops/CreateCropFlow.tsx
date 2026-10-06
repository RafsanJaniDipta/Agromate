"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftIcon, CheckIcon, MapIcon, PlusIcon } from "@/components/icons";
import { darkInput, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { addDays, createCropCycle, formatDay, toDateInputValue } from "@/lib/crops";
import type { Crop, CropCycleSummary, Field } from "@/types/crops";

type CreateCropFlowProps = {
  crops: Crop[];
  fields: Field[];
  onCreated: (cycle: CropCycleSummary) => void;
  onCancel: () => void;
};

// Step-by-step "start a new crop" form: pick a crop, then a field and the
// planting (and optionally harvest) dates. Submitting creates the cycle and
// the backend builds the whole growing plan for it.
export default function CreateCropFlow({ crops, fields, onCreated, onCancel }: CreateCropFlowProps) {
  const t = useTranslations("dashboard.crops");
  const locale = useLocale();

  const [cropId, setCropId] = useState<string | null>(null);
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [plantingDate, setPlantingDate] = useState(() => toDateInputValue(new Date()));
  const [useCustomHarvest, setUseCustomHarvest] = useState(false);
  const [customHarvest, setCustomHarvest] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const crop = useMemo(() => crops.find((c) => c.id === cropId) ?? null, [crops, cropId]);
  const planDays = crop ? crop.planDurationDays ?? crop.durationDays ?? null : null;
  const suggestedHarvest = plantingDate && planDays ? addDays(plantingDate, planDays) : null;
  const harvestDate = useCustomHarvest && customHarvest ? customHarvest : suggestedHarvest;

  const pickName = (en: string, bn: string | null) => (locale === "bn" && bn ? bn : en);

  const canSubmit = Boolean(crop && fieldId && plantingDate) && !submitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || !crop || !fieldId) return;
    setSubmitting(true);
    setError(false);
    try {
      const cycle = await createCropCycle({
        fieldId,
        cropId: crop.id,
        plantingDate,
        expectedHarvestDate: harvestDate ?? undefined,
      });
      onCreated(cycle);
    } catch {
      setError(true);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t("startNew")}</h2>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <ArrowLeftIcon className="size-4" />
          {t("back")}
        </button>
      </div>

      {/* Step 1: choose a crop */}
      <fieldset>
        <legend className="text-sm font-medium text-white/80">{t("chooseCrop")}</legend>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {crops.map((item) => {
            const selected = item.id === cropId;
            const hasPlan = item.planDurationDays != null;
            const durationLabel =
              item.planDurationLabel ??
              (item.durationDays ? t("daysLong", { days: item.durationDays }) : null);
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setCropId(item.id)}
                  aria-pressed={selected}
                  className={`w-full rounded-2xl border p-3.5 text-left transition ${
                    selected
                      ? "border-emerald-400/60 bg-emerald-400/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium">{pickName(item.name, item.nameBn)}</span>
                    {selected && <CheckIcon className="size-4 shrink-0 text-emerald-300" />}
                  </span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                    {durationLabel && <span className="text-white/60">{durationLabel}</span>}
                    <span
                      className={
                        hasPlan
                          ? "rounded-full bg-emerald-400/10 px-2 py-0.5 text-emerald-300"
                          : "rounded-full bg-white/10 px-2 py-0.5 text-white/45"
                      }
                    >
                      {hasPlan ? t("planBadge") : t("noPlanBadge")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </fieldset>

      {/* Step 2: choose a field */}
      <fieldset>
        <legend className="text-sm font-medium text-white/80">{t("chooseField")}</legend>
        {fields.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
            {t("noFields")}
          </p>
        ) : (
          <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
            {fields.map((field) => {
              const selected = field.id === fieldId;
              return (
                <li key={field.id}>
                  <button
                    type="button"
                    onClick={() => setFieldId(field.id)}
                    aria-pressed={selected}
                    className={`flex w-full items-center gap-2.5 rounded-2xl border p-3.5 text-left transition ${
                      selected
                        ? "border-emerald-400/60 bg-emerald-400/10"
                        : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                    }`}
                  >
                    <MapIcon className="size-4 shrink-0 text-white/60" />
                    <span className="text-sm">{field.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      {/* Step 3: dates */}
      <fieldset className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="planting-date" className="text-sm font-medium text-white/80">
            {t("plantingDate")}
          </label>
          <input
            id="planting-date"
            type="date"
            required
            value={plantingDate}
            onChange={(event) => setPlantingDate(event.target.value)}
            className={`${darkInput} mt-2 [color-scheme:dark]`}
          />
        </div>

        <div>
          <label className="flex cursor-pointer items-center gap-2 pt-9 text-sm text-white/80">
            <input
              type="checkbox"
              checked={useCustomHarvest}
              onChange={(event) => setUseCustomHarvest(event.target.checked)}
              className="peer sr-only"
            />
            <span className="flex size-5 items-center justify-center rounded-md border border-white/20 bg-white/5 peer-checked:border-emerald-500 peer-checked:bg-emerald-500">
              {useCustomHarvest && <CheckIcon className="size-3.5" />}
            </span>
            {t("customHarvest")}
          </label>
          {useCustomHarvest ? (
            <input
              type="date"
              value={customHarvest}
              onChange={(event) => setCustomHarvest(event.target.value)}
              className={`${darkInput} mt-2 [color-scheme:dark]`}
            />
          ) : (
            suggestedHarvest && (
              <p className="mt-2 text-sm text-white/60">
                {t.rich("harvestHint", {
                  date: () => <span className="text-emerald-300">{formatDay(locale, suggestedHarvest)}</span>,
                })}
              </p>
            )
          )}
        </div>
      </fieldset>

      {error && <p className="text-sm text-red-300">{t("createError")}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!canSubmit} className={primaryButton}>
          <span className="flex items-center gap-2">
            <PlusIcon className="size-4" />
            {submitting ? t("starting") : t("start")}
          </span>
        </button>
        <button type="button" onClick={onCancel} className={secondaryButton}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}