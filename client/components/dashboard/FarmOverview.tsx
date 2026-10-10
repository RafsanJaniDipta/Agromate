"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import FinanceChart from "@/components/dashboard/FinanceChart";
import { ActiveCropsCard, MoneyCard, ProfitCard } from "@/components/dashboard/StatCards";
import {
  getDashboardSummary,
  getFinancialSummary,
  type DashboardSummary,
  type FinancialSummary,
} from "@/lib/dashboard";

type OverviewData = { summary: DashboardSummary; finance: FinancialSummary };

// Dashboard KPI row and the income-vs-costs chart, from one load of the farmer's numbers.
export default function FarmOverview() {
  const t = useTranslations("dashboard");
  const [data, setData] = useState<OverviewData | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    Promise.all([getDashboardSummary(), getFinancialSummary()])
      .then(([summary, finance]) => setData({ summary, finance }))
      .catch(() => setLoadFailed(true));
  }, []);

  if (!data) {
    return (
      <DashCard>
        <p className="text-sm text-white/70">{loadFailed ? t("stats.loadError") : t("stats.loading")}</p>
      </DashCard>
    );
  }

  const { summary, finance } = data;
  // Sparklines stop at this month; later months haven't happened yet
  const monthsSoFar = finance.months.slice(0, new Date().getMonth() + 1);

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <ActiveCropsCard activeCrops={summary.activeCropCycles} fields={summary.totalFields} />
        <MoneyCard kind="expenses" amount={summary.totalExpenses} trend={monthsSoFar.map((m) => m.expenses)} />
        <MoneyCard kind="income" amount={summary.totalRevenue} trend={monthsSoFar.map((m) => m.income)} />
        <ProfitCard profit={summary.totalRevenue - summary.totalExpenses} />
      </div>

      <FinanceChart months={finance.months} year={finance.year} />
    </>
  );
}
