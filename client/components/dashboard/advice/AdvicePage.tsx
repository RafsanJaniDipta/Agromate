"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import CropAdvicePanel from "@/components/dashboard/advice/CropAdvicePanel";
import FertilizerAdvicePanel from "@/components/dashboard/advice/FertilizerAdvicePanel";
import { getFarms, type Farm } from "@/lib/farms";

type Tab = "crop" | "fertilizer";
const TABS: Tab[] = ["crop", "fertilizer"];

// Crop and fertilizer advice on one page, as two tabs that share the farmer's fields.
export default function AdvicePage() {
  const t = useTranslations("advice");
  const [tab, setTab] = useState<Tab>("crop");
  // null while loading; the panels still work without fields (soil / area typed in)
  const [farms, setFarms] = useState<Farm[] | null>(null);

  useEffect(() => {
    getFarms()
      .then(setFarms)
      .catch(() => setFarms([]));
  }, []);

  const chip = (isActive: boolean) =>
    `rounded-full px-4 py-2 text-sm transition ${
      isActive ? "bg-white text-zinc-900" : "border border-white/15 bg-black/30 text-white/80 backdrop-blur-xl hover:bg-white/10"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <header className="px-1">
        <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/60">{t("intro")}</p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist">
        {TABS.map((which) => (
          <button
            key={which}
            type="button"
            role="tab"
            aria-selected={tab === which}
            onClick={() => setTab(which)}
            className={chip(tab === which)}
          >
            {t(`tabs.${which}`)}
          </button>
        ))}
      </div>

      {farms && (tab === "crop" ? <CropAdvicePanel farms={farms} /> : <FertilizerAdvicePanel farms={farms} />)}
    </div>
  );
}
