"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDay } from "@/lib/crops";
import type { CropCycleSummary } from "@/types/crops";
import { MapIcon, WheatIcon } from "@/components/icons";

type CropCycleCardProps = {
  cycle: CropCycleSummary;
  isActive: boolean;
  onSelect: (cycle: CropCycleSummary) => void;
};

// One row in the "My crops" list: crop, field and the planting → harvest window.
export default function CropCycleCard({ cycle, isActive, onSelect }: CropCycleCardProps) {
  const t = useTranslations("dashboard.crops");
  const locale = useLocale();
  const name = locale === "bn" && cycle.crop.nameBn ? cycle.crop.nameBn : cycle.crop.name;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(cycle)}
        aria-pressed={isActive}
        className={`w-full rounded-2xl border p-3.5 text-left transition ${
          isActive
            ? "border-emerald-400/60 bg-emerald-400/10"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        }`}
      >
        <p className="flex items-center gap-2 font-medium">
          <WheatIcon className="size-4 shrink-0 text-emerald-300" />
          {name}
        </p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/60">
          <MapIcon className="size-3.5 shrink-0" />
          {cycle.field.name}
        </p>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-white/70">
          <span>
            {t("plantedOn")} <span className="text-white/50">{formatDay(locale, cycle.plantingDate)}</span>
          </span>
          <span>
            {t("harvestBy")} <span className="text-emerald-300">{formatDay(locale, cycle.expectedHarvestDate)}</span>
          </span>
        </div>
      </button>
    </li>
  );
}