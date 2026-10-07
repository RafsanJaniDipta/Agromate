"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import FormRow from "@/components/dashboard/FormRow";
import { AreaInput, SoilSelect, readAreaAndSoil } from "@/components/dashboard/farms/FarmFormFields";
import { darkInput, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { createFarm, updateFarm, type Farm } from "@/lib/farms";

type FarmFormProps = {
  // The farm being edited, or null to add a new one
  farm: Farm | null;
  onSaved: (farm: Farm) => void;
  onCancel: () => void;
};

// Form to add a farm or edit one: name, location, area and soil.
export default function FarmForm({ farm, onSaved, onCancel }: FarmFormProps) {
  const t = useTranslations("dashboard.farmsPage");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  // Keeps ids unique when an edit form and the add form are open together
  const idPrefix = `farm-${farm?.id ?? "new"}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      name: String(data.get("name")).trim(),
      location: String(data.get("location")).trim(),
      ...readAreaAndSoil(data),
    };

    setStatus("saving");
    try {
      onSaved(farm ? await updateFarm(farm.id, input) : await createFarm(input));
    } catch {
      setStatus("error");
    }
  }

  const isSaving = status === "saving";
  const saveLabel = farm ? (isSaving ? t("saving") : t("save")) : isSaving ? t("adding") : t("add");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormRow id={`${idPrefix}-name`} label={t("farmFields.name")}>
          <input
            id={`${idPrefix}-name`}
            name="name"
            required
            maxLength={60}
            defaultValue={farm?.name}
            placeholder={t("placeholders.farmName")}
            className={darkInput}
          />
        </FormRow>
        <FormRow id={`${idPrefix}-location`} label={t("farmFields.location")}>
          <input
            id={`${idPrefix}-location`}
            name="location"
            required
            maxLength={100}
            autoComplete="address-level2"
            defaultValue={farm?.location}
            placeholder={t("placeholders.location")}
            className={darkInput}
          />
        </FormRow>
        <FormRow id={`${idPrefix}-area`} label={`${t("farmFields.area")} (${t("optional")})`}>
          <AreaInput id={`${idPrefix}-area`} defaultValue={farm?.areaInAcres ?? null} />
        </FormRow>
        <FormRow id={`${idPrefix}-soil`} label={`${t("farmFields.soil")} (${t("optional")})`}>
          <SoilSelect id={`${idPrefix}-soil`} defaultValue={farm?.soilType ?? null} />
        </FormRow>
      </div>

      <p aria-live="polite" className="text-sm text-red-300">
        {status === "error" && t("saveError")}
      </p>

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={isSaving} className={primaryButton}>
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving} className={secondaryButton}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
