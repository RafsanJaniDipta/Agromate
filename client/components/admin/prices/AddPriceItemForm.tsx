"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import { darkInput, darkLabel, primaryButton } from "@/components/dashboard/formStyles";
import { createPriceItem, PRICE_CATEGORIES, type PriceCategory } from "@/lib/prices";

type Status = "idle" | "saving" | "error";

// Text fields in display order; the details field is optional
const fields = [
  { name: "nameBn", maxLength: 120 },
  { name: "nameEn", maxLength: 120 },
  { name: "unitBn", maxLength: 40, hint: "unitHint" },
  { name: "unitEn", maxLength: 40, hint: "unitHint" },
] as const;

// Adds an item to the price list, e.g. a pesticide with its pack size; set its price afterwards.
export default function AddPriceItemForm({ defaultCategory, onAdded }: { defaultCategory: PriceCategory; onAdded: () => void }) {
  const t = useTranslations("admin.prices");
  const tTabs = useTranslations("prices.tabs");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (name: string) => String(data.get(name) ?? "").trim();

    setStatus("saving");
    try {
      await createPriceItem({
        category: value("category") as PriceCategory,
        nameBn: value("nameBn"),
        nameEn: value("nameEn"),
        unitBn: value("unitBn"),
        unitEn: value("unitEn"),
        details: value("details"),
      });
      form.reset();
      setStatus("idle");
      onAdded();
    } catch {
      setStatus("error");
    }
  }

  return (
    <DashCard>
      <CardHeader icon={<PlusIcon />} title={t("addTitle")} />
      {/* Remounted per tab so the type follows the open tab */}
      <form key={defaultCategory} onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className={darkLabel}>{t("fields.category")}</span>
          <select name="category" defaultValue={defaultCategory} className={darkInput}>
            {PRICE_CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-zinc-900">
                {tTabs(category)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-2">
          <span className={darkLabel}>{t("fields.details")}</span>
          <input name="details" maxLength={300} placeholder={t("fields.detailsHint")} className={darkInput} />
        </label>
        {fields.map((field) => (
          <label key={field.name} className="flex flex-col gap-2">
            <span className={darkLabel}>{t(`fields.${field.name}`)}</span>
            <input
              name={field.name}
              required
              maxLength={field.maxLength}
              placeholder={"hint" in field ? t(`fields.${field.hint}`) : undefined}
              className={darkInput}
            />
          </label>
        ))}
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button type="submit" disabled={status === "saving"} className={primaryButton}>
            {status === "saving" ? t("adding") : t("add")}
          </button>
          {status === "error" && <p className="text-sm text-red-300">{t("addError")}</p>}
        </div>
      </form>
    </DashCard>
  );
}
