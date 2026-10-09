"use client";

import { useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { darkInput, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { todayDateInput } from "@/lib/cropCycles";
import { itemName, itemUnit, setOfficialPrice, setPriceItemActive, type AdminPriceItem } from "@/lib/prices";

type PriceItemRowProps = {
  item: AdminPriceItem;
  locale: string;
  onChanged: () => void;
};

type Status = "idle" | "saving" | "error";

// One item in the admin list: its latest price, a small form to set today's (or another day's)
// price, and hide/show. Fertilizer prices are saved as the government rate.
export default function PriceItemRow({ item, locale, onChanged }: PriceItemRowProps) {
  const t = useTranslations("admin.prices.table");
  const tSource = useTranslations("prices.source");
  const tMarket = useTranslations("market");
  const format = useFormatter();
  const [isEditing, setIsEditing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const { latest } = item;

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const min = Number(data.get("min"));
    const max = data.get("max") ? Number(data.get("max")) : min;
    setStatus("saving");
    try {
      await setOfficialPrice(item.id, min, max, String(data.get("date")));
      setStatus("idle");
      setIsEditing(false);
      onChanged();
    } catch {
      setStatus("error");
    }
  }

  async function toggleActive() {
    await setPriceItemActive(item.id, !item.isActive).catch(() => {});
    onChanged();
  }

  return (
    <li className={`flex flex-col gap-3 p-4 md:p-5 ${item.isActive ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {itemName(item, locale)} <span className="text-sm text-white/45">/ {itemUnit(item, locale)}</span>
            {!item.isActive && <span className="ml-2 text-xs text-amber-300">{t("hidden")}</span>}
          </p>
          {item.details && <p className="mt-0.5 text-xs text-white/50">{item.details}</p>}
          <p className="mt-1 text-sm text-white/70">
            {latest
              ? `${
                  latest.minPrice === latest.maxPrice
                    ? tMarket("price", { price: latest.minPrice })
                    : tMarket("priceRange", { min: latest.minPrice, max: latest.maxPrice })
                } · ${format.dateTime(new Date(latest.date), { day: "numeric", month: "short", timeZone: "UTC" })} · ${tSource(latest.source)}`
              : t("none")}
          </p>
        </div>
        <div className="flex gap-2">
          {/* TCB items update themselves; the button still lets an admin correct a day */}
          <button type="button" onClick={() => setIsEditing((open) => !open)} className={secondaryButton}>
            {t("setPrice")}
          </button>
          <button type="button" onClick={toggleActive} className={secondaryButton}>
            {item.isActive ? t("hide") : t("show")}
          </button>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
          <label className="flex flex-col gap-1.5 text-xs text-white/60">
            {t("min")}
            <input name="min" type="number" min="0.01" step="0.01" required defaultValue={latest?.minPrice} className={darkInput} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-white/60">
            {t("max")}
            <input name="max" type="number" min="0.01" step="0.01" defaultValue={latest?.maxPrice} className={darkInput} />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-white/60">
            {t("date")}
            <input name="date" type="date" required defaultValue={todayDateInput()} className={darkInput} />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={status === "saving"} className={primaryButton}>
              {status === "saving" ? t("saving") : t("save")}
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className={secondaryButton}>
              {t("cancel")}
            </button>
          </div>
          {status === "error" && <p className="text-sm text-red-300 sm:col-span-4">{t("saveError")}</p>}
        </form>
      )}
    </li>
  );
}
