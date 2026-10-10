"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import FormRow from "@/components/dashboard/FormRow";
import { darkInput, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { toDateInput, todayDateInput } from "@/lib/cropCycles";
import {
  HARVEST_UNITS,
  addHarvest,
  isHarvestUnit,
  updateHarvest,
  type Harvest,
  type HarvestUnit,
} from "@/lib/ledger";

type HarvestFormProps = {
  cropCycleId: string;
  // The harvest being edited, or left out to add a new one
  harvest?: Harvest;
  onSaved: (harvest: Harvest) => void;
  onCancel: () => void;
};

// Small form to record a harvest, or correct one: how much came off the field and what it sold for.
export default function HarvestForm({ cropCycleId, harvest, onSaved, onCancel }: HarvestFormProps) {
  const t = useTranslations("dashboard.myCropsPage.ledger");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const idPrefix = `harvest-${harvest?.id ?? cropCycleId}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    setStatus("saving");
    try {
      const input = {
        quantity: Number(data.get("quantity")),
        unit: String(data.get("unit")) as HarvestUnit,
        pricePerUnit: Number(data.get("pricePerUnit")),
        harvestDate: String(data.get("harvestDate")),
      };
      onSaved(harvest ? await updateHarvest(harvest.id, input) : await addHarvest(cropCycleId, input));
    } catch {
      setStatus("error");
    }
  }

  const isSaving = status === "saving";
  const saveLabel = harvest ? (isSaving ? t("saving") : t("save")) : isSaving ? t("adding") : t("add");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormRow id={`${idPrefix}-quantity`} label={t("fields.quantity")}>
          <input
            id={`${idPrefix}-quantity`}
            name="quantity"
            type="number"
            min={0.01}
            step="0.01"
            required
            inputMode="decimal"
            defaultValue={harvest?.quantity}
            className={darkInput}
          />
        </FormRow>
        <FormRow id={`${idPrefix}-unit`} label={t("fields.unit")}>
          <select
            id={`${idPrefix}-unit`}
            name="unit"
            defaultValue={harvest && isHarvestUnit(harvest.unit) ? harvest.unit : "MAUND"}
            className={darkInput}
          >
            {HARVEST_UNITS.map((unit) => (
              <option key={unit} value={unit} className="bg-zinc-900">
                {t(`units.${unit}`)}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow id={`${idPrefix}-price`} label={t("fields.pricePerUnit")}>
          <input
            id={`${idPrefix}-price`}
            name="pricePerUnit"
            type="number"
            min={0}
            step="0.01"
            required
            inputMode="decimal"
            aria-describedby={`${idPrefix}-price-hint`}
            defaultValue={harvest?.pricePerUnit}
            className={darkInput}
          />
          <span id={`${idPrefix}-price-hint`} className="text-xs text-white/50">
            {t("priceHint")}
          </span>
        </FormRow>
        <FormRow id={`${idPrefix}-date`} label={t("fields.date")}>
          <input
            id={`${idPrefix}-date`}
            name="harvestDate"
            type="date"
            required
            defaultValue={harvest ? toDateInput(harvest.harvestDate) : todayDateInput()}
            className={darkInput}
          />
        </FormRow>
      </div>

      {status === "error" && <p className="text-sm text-red-300">{t("saveError")}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isSaving} className={`${primaryButton} px-4 py-2 text-xs`}>
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving} className={`${secondaryButton} px-4 py-2 text-xs`}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
