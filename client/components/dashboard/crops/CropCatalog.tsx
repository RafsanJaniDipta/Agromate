"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SearchIcon } from "@/components/icons";
import DashCard from "@/components/dashboard/DashCard";
import CropCard from "@/components/dashboard/crops/CropCard";
import { darkInput, darkLabel } from "@/components/dashboard/formStyles";
import { getCrops, type Crop } from "@/lib/crops";
import { MONTH_NUMBERS, monthKey } from "@/lib/months";

// Waits for the farmer to stop typing before asking the server
const SEARCH_DELAY_MS = 300;

// The two ends of the planting-time filter; `label` is the message key
const periodEnds = [
  { name: "from", label: "fromLabel" },
  { name: "to", label: "toLabel" },
] as const;

type Period = Record<(typeof periodEnds)[number]["name"], number>;

// Farmer's crop guide: search the catalog and see which crops can be planted in a chosen period.
export default function CropCatalog() {
  const t = useTranslations("dashboard.cropsPage");
  const tMonth = useTranslations("months");
  const [search, setSearch] = useState("");
  // 0 means "any month"; picking just one end filters by that single month
  const [period, setPeriod] = useState<Period>({ from: 0, to: 0 });
  const [crops, setCrops] = useState<Crop[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const from = period.from || period.to;
    const to = period.to || period.from;
    // Ignores an older request that finishes after the filters changed again
    let isCurrent = true;

    const timer = setTimeout(() => {
      getCrops({ search: search.trim(), from, to })
        .then((loaded) => {
          if (!isCurrent) return;
          setCrops(loaded);
          setLoadFailed(false);
        })
        .catch(() => isCurrent && setLoadFailed(true));
    }, SEARCH_DELAY_MS);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [search, period]);

  return (
    <DashCard className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">{t("searchLabel")}</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/50" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className={`${darkInput} pl-10`}
          />
        </label>

        <fieldset className="flex w-full flex-col gap-2 sm:w-auto">
          <legend className={`${darkLabel} mb-2`}>{t("periodLabel")}</legend>
          <div className="grid grid-cols-2 gap-3 sm:w-96">
            {periodEnds.map(({ name, label }) => (
              <label key={name} className="flex flex-col gap-1">
                <span className="text-xs text-white/60">{t(label)}</span>
                <select
                  value={period[name]}
                  onChange={(event) => setPeriod((current) => ({ ...current, [name]: Number(event.target.value) }))}
                  className={darkInput}
                >
                  <option value={0} className="bg-zinc-900">
                    {t("anyMonth")}
                  </option>
                  {MONTH_NUMBERS.map((number) => (
                    <option key={number} value={number} className="bg-zinc-900">
                      {tMonth(monthKey(number))}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {loadFailed && <p className="text-sm text-red-300">{t("loadError")}</p>}
      {!loadFailed && !crops && <p className="text-sm text-white/70">{t("loading")}</p>}
      {crops?.length === 0 && <p className="text-sm text-white/70">{t("empty")}</p>}

      {crops && crops.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {crops.map((crop) => (
            <li key={crop.id}>
              <CropCard crop={crop} />
            </li>
          ))}
        </ul>
      )}
    </DashCard>
  );
}
