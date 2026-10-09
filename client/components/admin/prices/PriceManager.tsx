"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import { secondaryButton } from "@/components/dashboard/formStyles";
import AddPriceItemForm from "@/components/admin/prices/AddPriceItemForm";
import PriceItemRow from "@/components/admin/prices/PriceItemRow";
import {
  getAdminPriceItems,
  importTcbNow,
  PRICE_CATEGORIES,
  type AdminPriceItem,
  type PriceCategory,
} from "@/lib/prices";

type ImportStatus =
  | { state: "idle" | "running" | "error" }
  | { state: "done"; days: number; latestDate: string | null };

// Admin price list: crops refresh from TCB by themselves (with a button to fetch now),
// fertilizer rates and pesticide MRPs are set here, and new items can be added.
export default function PriceManager() {
  const t = useTranslations("admin.prices");
  const tTabs = useTranslations("prices.tabs");
  const tPrices = useTranslations("prices");
  const format = useFormatter();
  const locale = useLocale();
  const [items, setItems] = useState<AdminPriceItem[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [category, setCategory] = useState<PriceCategory>("FERTILIZER");
  const [importStatus, setImportStatus] = useState<ImportStatus>({ state: "idle" });

  const reload = useCallback(() => {
    getAdminPriceItems()
      .then((list) => {
        setItems(list);
        setLoadFailed(false);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  useEffect(reload, [reload]);

  async function runImport() {
    setImportStatus({ state: "running" });
    try {
      const result = await importTcbNow();
      setImportStatus({ state: "done", days: result?.importedDays ?? 0, latestDate: result?.latestDate ?? null });
      reload();
    } catch {
      setImportStatus({ state: "error" });
    }
  }

  const day = (date: string) => format.dateTime(new Date(date), { day: "numeric", month: "long", timeZone: "UTC" });
  const shown = items?.filter((item) => item.category === category);

  const chip = (isActive: boolean) =>
    `rounded-full px-4 py-2 text-sm transition ${
      isActive ? "bg-white text-zinc-900" : "border border-white/15 bg-black/30 text-white/80 hover:bg-white/10"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/60">{t("intro")}</p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <button type="button" onClick={runImport} disabled={importStatus.state === "running"} className={secondaryButton}>
            {importStatus.state === "running" ? t("importing") : t("import")}
          </button>
          <p aria-live="polite" className="text-xs text-white/60">
            {importStatus.state === "error" && <span className="text-red-300">{t("importError")}</span>}
            {importStatus.state === "done" &&
              (importStatus.days > 0
                ? t("importDone", { days: importStatus.days, date: importStatus.latestDate ? day(importStatus.latestDate) : "—" })
                : t("importNone", { date: importStatus.latestDate ? day(importStatus.latestDate) : "—" }))}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist">
        {PRICE_CATEGORIES.map((which) => (
          <button
            key={which}
            type="button"
            role="tab"
            aria-selected={category === which}
            onClick={() => setCategory(which)}
            className={chip(category === which)}
          >
            {tTabs(which)}
          </button>
        ))}
      </div>

      <DashCard className="p-0">
        {loadFailed && <p className="p-5 text-sm text-red-300">{tPrices("loadError")}</p>}
        {!loadFailed && !items && <p className="p-5 text-sm text-white/60">{tPrices("loading")}</p>}
        <ul className="divide-y divide-white/10">
          {shown?.map((item) => (
            <PriceItemRow key={item.id} item={item} locale={locale} onChanged={reload} />
          ))}
        </ul>
      </DashCard>

      <AddPriceItemForm defaultCategory={category} onAdded={reload} />
    </div>
  );
}
