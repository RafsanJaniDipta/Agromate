import { useFormatter, useTranslations } from "next-intl";
import Sparkline from "@/components/dashboard/Sparkline";
import StatCard, { ChangeBadge } from "@/components/dashboard/StatCard";
import { CoinsIcon, DropIcon, TractorIcon, WheatIcon } from "@/components/icons";
import type { EquipmentStat, RevenueStat, WaterUsageStat, YieldStat } from "@/types/dashboard";

// The four KPI cards in the dashboard's middle row.

const bigNumber = "text-3xl font-semibold tracking-tight";

export function YieldCard({ stat }: { stat: YieldStat }) {
  const t = useTranslations("dashboard.stats");

  return (
    <StatCard icon={<WheatIcon />} title={t("yield")}>
      <p className={bigNumber}>{t("tonnes", { value: stat.totalTonnes })}</p>
      <p className="mt-1 flex items-center gap-2 text-sm text-white/60">
        {t("vsLastWeek")} <ChangeBadge percent={stat.changePercent} />
      </p>
      <Sparkline values={stat.trend} className="mt-auto pt-3" />
    </StatCard>
  );
}

// Bar turns amber once usage passes this share of the daily limit
const WATER_WARNING_RATIO = 0.9;

export function WaterUsageCard({ stat }: { stat: WaterUsageStat }) {
  const t = useTranslations("dashboard.stats");
  const format = useFormatter();
  const ratio = stat.dailyLimitCubicMeters ? stat.usedCubicMeters / stat.dailyLimitCubicMeters : 0;
  const barColor = ratio >= WATER_WARNING_RATIO ? "bg-amber-400" : "bg-blue-500";

  return (
    <StatCard icon={<DropIcon />} title={t("water")}>
      <p className={bigNumber}>{t("cubicMeters", { value: stat.usedCubicMeters })}</p>

      <div className="mt-auto pt-4">
        <div className="h-3 overflow-hidden rounded-full bg-blue-950/80">
          <div
            className={`h-full rounded-full ${barColor}`}
            style={{ width: `${Math.min(ratio, 1) * 100}%` }}
          />
        </div>
        <p className="mt-3 text-sm text-white/60">
          {t.rich("ofDailyLimit", {
            percent: format.number(ratio, { style: "percent", maximumFractionDigits: 0 }),
            highlight: (chunks) => <span className="text-white">{chunks}</span>,
          })}
        </p>
      </div>
    </StatCard>
  );
}

export function EquipmentCard({ stat }: { stat: EquipmentStat }) {
  const t = useTranslations("dashboard.stats");

  // One segment per machine: working first, then in maintenance, then idle
  const segments = Array.from({ length: stat.total }, (_, index) => {
    if (index < stat.working) return "bg-green-500";
    if (index < stat.working + stat.maintenance) return "bg-yellow-400";
    return "bg-white/15";
  });

  const legend = [
    { key: "working", dot: "bg-green-500" },
    { key: "maintenance", dot: "bg-yellow-400" },
  ] as const;

  return (
    <StatCard icon={<TractorIcon />} title={t("equipment")}>
      <p className="flex items-baseline gap-2">
        <span className={bigNumber}>
          {t("activeCount", { active: stat.working, total: stat.total })}
        </span>
        <span className="text-white/70">{t("active")}</span>
      </p>

      <ul className="mt-2 text-sm text-white/70">
        {legend.map(({ key, dot }) => (
          <li key={key} className="flex items-center gap-2">
            <span className={`size-2.5 rounded-full ${dot}`} />
            {t(key)}
          </li>
        ))}
      </ul>

      <div aria-hidden className="mt-auto flex gap-1 pt-3">
        {segments.map((color, index) => (
          <span key={index} className={`h-2 flex-1 rounded-full ${color}`} />
        ))}
      </div>
    </StatCard>
  );
}

export function RevenueCard({ stat }: { stat: RevenueStat }) {
  const t = useTranslations("dashboard.stats");
  const format = useFormatter();

  return (
    <StatCard icon={<CoinsIcon />} title={t("revenue")}>
      <p className={bigNumber}>
        {format.number(stat.amount, {
          style: "currency",
          currency: stat.currency,
          currencyDisplay: "narrowSymbol",
          maximumFractionDigits: 0,
        })}
      </p>
      <p className="mt-1 flex items-center gap-2 text-sm text-white/60">
        {t("thisMonth")} <ChangeBadge percent={stat.changePercent} />
      </p>
      <Sparkline values={stat.trend} className="mt-auto pt-3" />
    </StatCard>
  );
}
