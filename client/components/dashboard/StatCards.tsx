import { useTranslations } from "next-intl";
import Sparkline from "@/components/dashboard/Sparkline";
import StatCard from "@/components/dashboard/StatCard";
import { useTaka } from "@/components/dashboard/useTaka";
import { CartIcon, ChartIcon, CoinsIcon, SproutIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

// The four KPI cards in the dashboard's middle row.

const bigNumber = "text-3xl font-semibold tracking-tight";

// How many crops are on the fields now, out of how many fields
export function ActiveCropsCard({ activeCrops, fields }: { activeCrops: number; fields: number }) {
  const t = useTranslations("dashboard.stats");

  return (
    <StatCard icon={<SproutIcon />} title={t("activeCrops")}>
      <p className={bigNumber}>{t("count", { value: activeCrops })}</p>
      <p className="mt-1 text-sm text-white/60">{t("onFields", { fields })}</p>
      <Link href="/dashboard/my-crops" className="mt-auto pt-3 text-sm text-green-400 hover:underline">
        {t("seeCrops")}
      </Link>
    </StatCard>
  );
}

type MoneyCardProps = {
  kind: "expenses" | "income";
  amount: number;
  // This year's months so far, oldest first, for the sparkline
  trend: number[];
};

// All-time costs or income, with this year's month-by-month line under it
export function MoneyCard({ kind, amount, trend }: MoneyCardProps) {
  const t = useTranslations("dashboard.stats");
  const taka = useTaka();

  return (
    <StatCard icon={kind === "income" ? <CoinsIcon /> : <CartIcon />} title={t(kind)}>
      <p className={bigNumber}>{taka(amount)}</p>
      <p className="mt-1 text-sm text-white/60">{t("allTime")}</p>
      <Sparkline values={trend} className="mt-auto pt-3" />
    </StatCard>
  );
}

// Income minus costs: green when ahead, red when behind
export function ProfitCard({ profit }: { profit: number }) {
  const t = useTranslations("dashboard.stats");
  const taka = useTaka();
  const isLoss = profit < 0;

  return (
    <StatCard icon={<ChartIcon />} title={isLoss ? t("loss") : t("profit")}>
      <p className={`${bigNumber} ${isLoss ? "text-red-400" : "text-green-400"}`}>{taka(Math.abs(profit))}</p>
      <p className="mt-1 text-sm text-white/60">{t("profitFormula")}</p>
      <Link href="/dashboard/analytics" className="mt-auto pt-3 text-sm text-green-400 hover:underline">
        {t("seeAnalytics")}
      </Link>
    </StatCard>
  );
}
