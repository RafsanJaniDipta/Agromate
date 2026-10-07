"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import CropCycleCard from "@/components/dashboard/myCrops/CropCycleCard";
import NewCropCycleForm from "@/components/dashboard/myCrops/NewCropCycleForm";
import { primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { Link } from "@/i18n/navigation";
import { ACTIVE_STATUSES, getCropCycles, type CropCycle } from "@/lib/cropCycles";
import { getCrops, type Crop } from "@/lib/crops";
import { getFarms, type Farm } from "@/lib/farms";

const filters = ["ACTIVE", "HARVESTED", "FAILED", "ALL"] as const;
type Filter = (typeof filters)[number];

type Notice = "added" | "updated" | "deleted" | "deleteError";

// Everything the page needs, loaded together
type PageData = { cycles: CropCycle[]; farms: Farm[]; crops: Crop[] };

function matchesFilter(cycle: CropCycle, filter: Filter) {
  if (filter === "ALL") return true;
  if (filter === "ACTIVE") return ACTIVE_STATUSES.includes(cycle.status);
  return cycle.status === filter;
}

// Farmer's planted crops: add one to a field, follow it to harvest, filter by status.
export default function MyCrops() {
  const t = useTranslations("dashboard.myCropsPage");
  const [data, setData] = useState<PageData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>("ACTIVE");
  const [isAdding, setIsAdding] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    Promise.all([getCropCycles(), getFarms(), getCrops()])
      .then(([cycles, farms, crops]) => setData({ cycles, farms, crops }))
      .catch(() => setLoadFailed(true));
  }, []);

  if (loadFailed) {
    return (
      <DashCard>
        <p className="text-sm text-red-300">{t("loadError")}</p>
      </DashCard>
    );
  }

  if (!data) {
    return (
      <DashCard>
        <p className="text-sm text-white/70">{t("loading")}</p>
      </DashCard>
    );
  }

  const hasFields = data.farms.some((farm) => farm.fields.length > 0);
  const farmNameById = new Map(data.farms.map((farm) => [farm.id, farm.name]));
  const visibleCycles = data.cycles.filter((cycle) => matchesFilter(cycle, filter));

  const updateCycles = (change: (cycles: CropCycle[]) => CropCycle[]) =>
    setData((current) => current && { ...current, cycles: change(current.cycles) });

  function handleAdded(cycle: CropCycle) {
    // Newest on top; switch to a filter that shows it
    updateCycles((cycles) => [cycle, ...cycles]);
    if (!matchesFilter(cycle, filter)) setFilter("ALL");
    setIsAdding(false);
    setNotice("added");
  }

  function handleSaved(saved: CropCycle) {
    updateCycles((cycles) => cycles.map((cycle) => (cycle.id === saved.id ? saved : cycle)));
    setNotice("updated");
  }

  function handleDeleted(id: string) {
    updateCycles((cycles) => cycles.filter((cycle) => cycle.id !== id));
    setNotice("deleted");
  }

  // Crops grow on fields, so a farmer without any is sent to add one first
  if (!hasFields) {
    return (
      <DashCard className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-semibold">{t("noFieldsTitle")}</h2>
        <p className="text-sm text-white/70">{t("noFieldsText")}</p>
        <Link href="/dashboard/fields" className={primaryButton}>
          {t("goToFields")}
        </Link>
      </DashCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {notice && (
        <p
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice === "deleteError"
              ? "border-red-300/30 bg-red-300/10 text-red-100"
              : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
          }`}
        >
          {t(`notices.${notice}`)}
        </p>
      )}

      {isAdding && (
        <DashCard className="flex flex-col gap-4">
          <CardHeader icon={<PlusIcon />} title={t("addTitle")} />
          <NewCropCycleForm
            farms={data.farms}
            crops={data.crops}
            onSaved={handleAdded}
            onCancel={() => setIsAdding(false)}
          />
        </DashCard>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
          {filters.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              aria-pressed={option === filter}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                option === filter ? "bg-white text-zinc-900" : "border border-white/15 text-white/70 hover:text-white"
              }`}
            >
              {t(`filters.${option}`)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/crops" className={secondaryButton}>
            {t("guideLink")}
          </Link>
          {!isAdding && (
            <button
              type="button"
              onClick={() => {
                setIsAdding(true);
                setNotice(null);
              }}
              className={`${primaryButton} inline-flex items-center gap-2`}
            >
              <PlusIcon className="size-4" />
              {t("addButton")}
            </button>
          )}
        </div>
      </div>

      {visibleCycles.length === 0 ? (
        <DashCard>
          <p className="text-sm text-white/70">{t("empty")}</p>
        </DashCard>
      ) : (
        <ul className="grid items-stretch gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {visibleCycles.map((cycle) => (
            <li key={cycle.id}>
              <CropCycleCard
                cycle={cycle}
                farmName={farmNameById.get(cycle.field.farmId)}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
                onDeleteFailed={() => setNotice("deleteError")}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
