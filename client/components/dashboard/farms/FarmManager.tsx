"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import FarmCard, { type FarmNotice } from "@/components/dashboard/farms/FarmCard";
import FarmForm from "@/components/dashboard/farms/FarmForm";
import { primaryButton } from "@/components/dashboard/formStyles";
import { getFarms, type Farm } from "@/lib/farms";

// Farmer's farms and fields: add a farm, then manage the fields inside each one.
export default function FarmManager() {
  const t = useTranslations("dashboard.farmsPage");
  const [farms, setFarms] = useState<Farm[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [notice, setNotice] = useState<FarmNotice | null>(null);

  useEffect(() => {
    getFarms()
      .then(setFarms)
      .catch(() => setLoadFailed(true));
  }, []);

  function startAdding() {
    setIsAdding(true);
    setNotice(null);
  }

  function handleFarmAdded(farm: Farm) {
    // Newest first, matching the server's order
    setFarms((current) => [farm, ...(current ?? [])]);
    setIsAdding(false);
    setNotice("farmAdded");
  }

  function replaceFarm(changed: Farm) {
    setFarms((current) => current?.map((farm) => (farm.id === changed.id ? changed : farm)) ?? null);
  }

  function removeFarm(farmId: string) {
    setFarms((current) => current?.filter((farm) => farm.id !== farmId) ?? null);
  }

  if (loadFailed) {
    return (
      <DashCard>
        <p className="text-sm text-red-300">{t("loadError")}</p>
      </DashCard>
    );
  }

  if (!farms) {
    return (
      <DashCard>
        <p className="text-sm text-white/70">{t("loading")}</p>
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

      {isAdding ? (
        <DashCard className="flex flex-col gap-4">
          <CardHeader icon={<PlusIcon />} title={t("addFarmTitle")} />
          <FarmForm farm={null} onSaved={handleFarmAdded} onCancel={() => setIsAdding(false)} />
        </DashCard>
      ) : farms.length === 0 ? (
        <DashCard className="flex flex-col items-start gap-3">
          <h2 className="text-lg font-semibold">{t("emptyTitle")}</h2>
          <p className="text-sm text-white/70">{t("emptyText")}</p>
          <button type="button" onClick={startAdding} className={`${primaryButton} inline-flex items-center gap-2`}>
            <PlusIcon className="size-4" />
            {t("addFarm")}
          </button>
        </DashCard>
      ) : (
        <div className="flex justify-end">
          <button type="button" onClick={startAdding} className={`${primaryButton} inline-flex items-center gap-2`}>
            <PlusIcon className="size-4" />
            {t("addFarm")}
          </button>
        </div>
      )}

      {farms.length > 0 && (
        <ul className="grid items-start gap-5 xl:grid-cols-2">
          {farms.map((farm) => (
            <li key={farm.id}>
              <FarmCard
                farm={farm}
                onChange={replaceFarm}
                onDeleted={removeFarm}
                onNotice={setNotice}
                allFields={farms.flatMap((each) => each.fields)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
