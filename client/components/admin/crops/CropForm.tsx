"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon, WheatIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import { darkInput, darkLabel, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { ApiError } from "@/lib/api";
import { createCrop, updateCrop, type Crop, type CropInput } from "@/lib/crops";
import { MONTH_NUMBERS, monthKey } from "@/lib/months";

type TextField = "name" | "nameBn" | "category" | "idealSoil";
type MonthField = "sowingStartMonth" | "sowingEndMonth";
type NumberField = "optimalTemp" | "optimalRainfall" | "durationDays";
type LongTextField = "description" | "descriptionBn";

// Short text inputs, in display order. Only the English name is required.
const textInputs: { name: TextField; required?: boolean }[] = [
  { name: "name", required: true },
  { name: "nameBn" },
  { name: "category" },
  { name: "idealSoil" },
];

const numberInputs: { name: NumberField; min?: number; step: string }[] = [
  { name: "optimalTemp", step: "0.1" },
  { name: "optimalRainfall", min: 0, step: "0.1" },
  { name: "durationDays", min: 1, step: "1" },
];

const monthInputs: MonthField[] = ["sowingStartMonth", "sowingEndMonth"];

const longTextInputs: LongTextField[] = ["description", "descriptionBn"];

type FormError = "monthsIncomplete" | "duplicate" | "error";
type FormStatus = "idle" | "saving" | FormError;

type CropFormProps = {
  // The crop being edited, or null to add a new one
  editing: Crop | null;
  onSaved: (crop: Crop) => void;
  onCancel: () => void;
};

// Reads the form; a blank optional field is sent as null so editing can clear it
function readCropInput(form: HTMLFormElement): CropInput {
  const data = new FormData(form);
  const text = (name: string) => String(data.get(name) ?? "").trim() || null;
  const number = (name: string) => {
    const value = text(name);
    return value === null ? null : Number(value);
  };

  return {
    name: text("name") ?? "",
    nameBn: text("nameBn"),
    category: text("category"),
    sowingStartMonth: number("sowingStartMonth"),
    sowingEndMonth: number("sowingEndMonth"),
    idealSoil: text("idealSoil"),
    optimalTemp: number("optimalTemp"),
    optimalRainfall: number("optimalRainfall"),
    durationDays: number("durationDays"),
    description: text("description"),
    descriptionBn: text("descriptionBn"),
  };
}

// Admin form to add a crop to the catalog or edit one.
export default function CropForm({ editing, onSaved, onCancel }: CropFormProps) {
  const t = useTranslations("admin.crops");
  const tMonth = useTranslations("months");
  const [status, setStatus] = useState<FormStatus>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = readCropInput(event.currentTarget);
    // A planting window needs both ends; the server rejects just one
    if ((input.sowingStartMonth === null) !== (input.sowingEndMonth === null)) {
      return setStatus("monthsIncomplete");
    }

    setStatus("saving");
    try {
      onSaved(editing ? await updateCrop(editing.id, input) : await createCrop(input));
    } catch (error) {
      setStatus(error instanceof ApiError && error.status === 409 ? "duplicate" : "error");
    }
  }

  const isSaving = status === "saving";
  const error = status !== "idle" && status !== "saving" ? status : null;
  const saveLabel = editing ? (isSaving ? t("saving") : t("save")) : isSaving ? t("adding") : t("add");
  // Labels of fields that may be left blank
  const fieldLabel = (name: TextField | MonthField | NumberField | LongTextField, required?: boolean) =>
    required ? t(`fields.${name}`) : `${t(`fields.${name}`)} (${t("optional")})`;

  return (
    <DashCard>
      <CardHeader
        icon={editing ? <WheatIcon /> : <PlusIcon />}
        title={editing ? t("editTitle") : t("addTitle")}
      />

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {textInputs.map(({ name, required }) => (
            <div key={name} className="flex flex-col gap-2">
              <label htmlFor={`crop-${name}`} className={darkLabel}>
                {fieldLabel(name, required)}
              </label>
              <input
                id={`crop-${name}`}
                name={name}
                required={required}
                defaultValue={editing?.[name] ?? ""}
                placeholder={t(`placeholders.${name}`)}
                className={darkInput}
              />
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {monthInputs.map((name) => (
            <div key={name} className="flex flex-col gap-2">
              <label htmlFor={`crop-${name}`} className={darkLabel}>
                {fieldLabel(name)}
              </label>
              <select
                id={`crop-${name}`}
                name={name}
                defaultValue={editing?.[name] ?? ""}
                className={darkInput}
              >
                <option value="" className="bg-zinc-900">
                  {t("noMonth")}
                </option>
                {MONTH_NUMBERS.map((month) => (
                  <option key={month} value={month} className="bg-zinc-900">
                    {tMonth(monthKey(month))}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {numberInputs.map(({ name, min, step }) => (
            <div key={name} className="flex flex-col gap-2">
              <label htmlFor={`crop-${name}`} className={darkLabel}>
                {fieldLabel(name)}
              </label>
              <input
                id={`crop-${name}`}
                name={name}
                type="number"
                min={min}
                step={step}
                defaultValue={editing?.[name] ?? ""}
                className={darkInput}
              />
            </div>
          ))}
        </div>

        {longTextInputs.map((name) => (
          <div key={name} className="flex flex-col gap-2">
            <label htmlFor={`crop-${name}`} className={darkLabel}>
              {fieldLabel(name)}
            </label>
            <textarea
              id={`crop-${name}`}
              name={name}
              rows={3}
              defaultValue={editing?.[name] ?? ""}
              className={`${darkInput} resize-y`}
            />
          </div>
        ))}

        <p aria-live="polite" className="text-sm text-red-300">
          {error && t(`formErrors.${error}`)}
        </p>

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={isSaving} className={primaryButton}>
            {saveLabel}
          </button>
          {editing && (
            <button type="button" onClick={onCancel} disabled={isSaving} className={secondaryButton}>
              {t("cancel")}
            </button>
          )}
        </div>
      </form>
    </DashCard>
  );
}
