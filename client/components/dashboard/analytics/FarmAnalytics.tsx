"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import FinanceChart from "@/components/dashboard/FinanceChart";
import ShareBars from "@/components/dashboard/analytics/ShareBars";
import { useTaka } from "@/components/dashboard/useTaka";
import { CartIcon, SproutIcon } from "@/components/icons";
import { cropName } from "@/lib/crops";
import { getCropDistribution, getFinancialSummary, type CropShare, type FinancialSummary } from "@/lib/dashboard";

// This year and the two before it
const YEARS_SHOWN = 3;

// Farmer's analytics: a year's money (totals, by month, by expense type) and what grows where now.
export default function FarmAnalytics() {
  const t = useTranslations("dashboard.analyticsPage");
  const tLedger = useTranslations("dashboard.myCropsPage.ledger");
  const locale = useLocale();
  const taka = useTaka();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const [finance, setFinance] = useState<FinancialSummary | null>(null);
  const [crops, setCrops] = useState<CropShare[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  // The crop mix is about today, so it loads once
  useEffect(() => {
    getCropDistribution()
      .then(setCrops)
      .catch(() => setLoadFailed(true));
  }, []);

  useEffect(() => {
    // Ignores an older request that finishes after another year was picked
    let isCurrent = true;
    getFinancialSummary(year)
      .then((loaded) => isCurrent && setFinance(loaded))
      .catch(() => isCurrent && setLoadFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [year]);

  if (loadFailed) {
    return (
      <DashCard>
        <p className="text-sm text-red-300">{t("loadError")}</p>
      </DashCard>
    );
  }

  const years = Array.from({ length: YEARS_SHOWN }, (_, index) => thisYear - index);
  const totals = finance?.yearTotals;
  const biggestExpense = finance?.expensesByCategory[0]?.amount ?? 0;
  const largestArea = Math.max(...(crops ?? []).map((crop) => crop.area), 0);

  const totalCards = totals
    ? ([
        { key: "income", value: taka(totals.income), color: "" },
        { key: "expenses", value: taka(totals.expenses), color: "" },
        {
          key: totals.profit < 0 ? "loss" : "profit",
          value: taka(Math.abs(totals.profit)),
          color: totals.profit < 0 ? "text-red-400" : "text-green-400",
        },
      ] as const)
    : [];

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label={t("yearLabel")} className="flex flex-wrap gap-2">
        {years.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setYear(option);
              setFinance(null);
            }}
            aria-pressed={option === year}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              option === year ? "bg-white text-zinc-900" : "border border-white/15 text-white/70 hover:text-white"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {!finance || !totals ? (
        <DashCard>
          <p className="text-sm text-white/70">{t("loading")}</p>
        </DashCard>
      ) : (
        <>
          <dl className="grid gap-5 sm:grid-cols-3">
            {totalCards.map(({ key, value, color }) => (
              <DashCard key={key}>
                <dt className="text-sm text-white/60">{t(`totals.${key}`, { year })}</dt>
                <dd className={`mt-2 text-3xl font-semibold tracking-tight ${color}`}>{value}</dd>
              </DashCard>
            ))}
          </dl>

          <FinanceChart months={finance.months} year={finance.year} />

          <div className="grid items-start gap-5 xl:grid-cols-2">
            <DashCard className="flex flex-col gap-4">
              <CardHeader icon={<CartIcon />} title={t("expensesByCategory", { year })} />
              {finance.expensesByCategory.length === 0 ? (
                <p className="text-sm text-white/60">{t("noExpenses")}</p>
              ) : (
                <ShareBars
                  bars={finance.expensesByCategory.map(({ category, amount }) => ({
                    key: category,
                    label: tLedger(`categories.${category}`),
                    value: taka(amount),
                    share: biggestExpense ? amount / biggestExpense : 0,
                  }))}
                />
              )}
            </DashCard>

            <DashCard className="flex flex-col gap-4">
              <CardHeader icon={<SproutIcon />} title={t("cropMix")} />
              {!crops && <p className="text-sm text-white/60">{t("loading")}</p>}
              {crops?.length === 0 && <p className="text-sm text-white/60">{t("noCrops")}</p>}
              {crops && crops.length > 0 && (
                <ShareBars
                  bars={crops.map((crop) => ({
                    key: crop.cropName,
                    label: cropName({ name: crop.cropName, nameBn: crop.cropNameBn }, locale),
                    value: t("cropMixValue", { fields: crop.count, acres: crop.area }),
                    // Fields without an area still show, as a sliver
                    share: largestArea ? crop.area / largestArea : 0,
                  }))}
                />
              )}
            </DashCard>
          </div>
        </>
      )}
    </div>
  );
}
