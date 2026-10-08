"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import FormRow from "@/components/dashboard/FormRow";
import { AreaInput, SoilSelect, readAreaAndSoil } from "@/components/dashboard/farms/FarmFormFields";
import { darkInput, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { createField, updateField, type Field } from "@/lib/farms";

type FieldFormProps = {
  farmId: string;
  // The field being edited, or null to add a new one
  field: Field | null;
  onSaved: (field: Field) => void;
  onCancel: () => void;
};

// Compact form to add a field to a farm or edit one: name, area and soil.
export default function FieldForm({ farmId, field, onSaved, onCancel }: FieldFormProps) {
  const t = useTranslations("dashboard.farmsPage");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const idPrefix = `field-${field?.id ?? `new-${farmId}`}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = { name: String(data.get("name")).trim(), ...readAreaAndSoil(data) };

    setStatus("saving");
    try {
      onSaved(field ? await updateField(field.id, input) : await createField(farmId, input));
    } catch {
      setStatus("error");
    }
  }

  const isSaving = status === "saving";
  const saveLabel = field ? (isSaving ? t("saving") : t("save")) : isSaving ? t("adding") : t("add");

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <FormRow id={`${idPrefix}-name`} label={t("fieldFields.name")}>
          <input
            id={`${idPrefix}-name`}
            name="name"
            required
            maxLength={60}
            defaultValue={field?.name}
            placeholder={t("placeholders.fieldName")}
            className={darkInput}
          />
        </FormRow>
        <FormRow id={`${idPrefix}-area`} label={`${t("fieldFields.area")} (${t("optional")})`}>
          <AreaInput id={`${idPrefix}-area`} defaultValue={field?.areaInAcres ?? null} />
        </FormRow>
        <FormRow id={`${idPrefix}-soil`} label={`${t("fieldFields.soil")} (${t("optional")})`}>
          <SoilSelect id={`${idPrefix}-soil`} defaultValue={field?.soilType ?? null} />
        </FormRow>
      </div>

      {status === "error" && (
        <p aria-live="polite" className="text-sm text-red-300">
          {t("saveError")}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={isSaving} className={`${primaryButton} px-4 py-2 text-xs`}>
          {saveLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className={`${secondaryButton} px-4 py-2 text-xs`}
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
