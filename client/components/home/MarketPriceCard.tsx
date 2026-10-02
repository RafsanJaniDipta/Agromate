import { useFormatter, useTranslations } from "next-intl";
import CardTitle from "@/components/home/CardTitle";
import GlassCard from "@/components/home/GlassCard";

// Sample prices (taka per kg) until a live market feed is connected
const priceGroups = [
  {
    id: "crops",
    items: [
      { id: "rice", price: 52, change: 1.8 },
      { id: "wheat", price: 48, change: -0.6 },
      { id: "potato", price: 30, change: 2.4 },
    ],
  },
  {
    id: "fertilizer",
    items: [
      { id: "urea", price: 27, change: 0 },
      { id: "tsp", price: 27, change: 1.2 },
      { id: "mop", price: 20, change: -1.1 },
    ],
  },
] as const;

function Trend({ change }: { change: number }) {
  const format = useFormatter();
  const percent = format.number(Math.abs(change) / 100, {
    style: "percent",
    maximumFractionDigits: 1,
  });

  if (change > 0) return <span className="text-lime-400">▲ {percent}</span>;
  if (change < 0) return <span className="text-red-400">▼ {percent}</span>;
  return <span className="text-white/50">— {percent}</span>;
}

// Current market prices for crops and fertilizer.
export default function MarketPriceCard() {
  const t = useTranslations("market");

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <CardTitle icon="↗">{t("title")}</CardTitle>
        <span className="text-[11px] text-white/50">{t("today")}</span>
      </div>

      {priceGroups.map(({ id, items }) => (
        <div key={id} className="mt-4">
          <p className="text-[10px] uppercase tracking-wider text-white/50">{t(`groups.${id}`)}</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {items.map(({ id, price, change }) => (
              <li key={id} className="grid grid-cols-[1fr_auto_4.5rem] items-center gap-3">
                <span className="text-white/80">{t(`items.${id}`)}</span>
                <span className="font-semibold">{t("pricePerKg", { price })}</span>
                <span className="text-right text-xs">
                  <Trend change={change} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </GlassCard>
  );
}
