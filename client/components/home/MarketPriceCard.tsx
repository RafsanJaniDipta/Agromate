import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import CardTitle from "@/components/home/CardTitle";
import GlassCard from "@/components/home/GlassCard";
import { getPriceHighlights, itemName, itemUnit, type PriceItem } from "@/lib/prices";

async function Trend({ change }: { change: number | null }) {
  const format = await getFormatter();
  if (change === null) return <span className="text-white/40">—</span>;

  const percent = format.number(Math.abs(change) / 100, { style: "percent", maximumFractionDigits: 1 });
  if (change > 0) return <span className="text-lime-400">▲ {percent}</span>;
  if (change < 0) return <span className="text-red-400">▼ {percent}</span>;
  return <span className="text-white/50">— {percent}</span>;
}

// Today's crop prices (TCB, Dhaka) and the government fertilizer rates, with the weekly change.
// Prices change once a day, so the data is cached for a few minutes (see getPriceHighlights).
export default async function MarketPriceCard() {
  const [t, format, locale, highlights] = await Promise.all([
    getTranslations("market"),
    getFormatter(),
    getLocale(),
    getPriceHighlights(),
  ]);

  const groups = [
    { id: "crops", items: highlights?.crops ?? [] },
    { id: "fertilizer", items: highlights?.fertilizers ?? [] },
  ] as const;
  const hasPrices = groups.some(({ items }) => items.some((item) => item.official));
  // Dates are calendar days stored at UTC midnight
  const latestCropDate = highlights?.crops.find((item) => item.official)?.official?.date;

  const price = (item: PriceItem) => {
    const official = item.official!;
    const amount =
      official.minPrice === official.maxPrice
        ? t("price", { price: official.minPrice })
        : t("priceRange", { min: official.minPrice, max: official.maxPrice });
    return `${amount}${t("per", { unit: itemUnit(item, locale) })}`;
  };

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <CardTitle icon="↗">{t("title")}</CardTitle>
        <span className="flex items-center gap-1.5 text-[11px] text-white/60">
          <span aria-hidden className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-lime-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-lime-400" />
          </span>
          {t("live")}
        </span>
      </div>

      {!hasPrices && <p className="mt-4 text-sm text-white/60">{t("unavailable")}</p>}

      {hasPrices &&
        groups.map(({ id, items }) => (
          <div key={id} className="mt-4">
            <p className="text-[10px] uppercase tracking-wider text-white/50">{t(`groups.${id}`)}</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {items
                .filter((item) => item.official)
                .map((item) => (
                  <li key={item.id} className="grid grid-cols-[1fr_auto_4.5rem] items-center gap-3">
                    <span className="truncate text-white/80">{itemName(item, locale)}</span>
                    <span className="font-semibold">{price(item)}</span>
                    <span className="text-right text-xs">
                      <Trend change={item.weekChangePercent} />
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        ))}

      {hasPrices && (
        <p className="mt-4 text-[10px] leading-relaxed text-white/45">
          {latestCropDate &&
            `${t("updated", {
              date: format.dateTime(new Date(latestCropDate), { day: "numeric", month: "long", timeZone: "UTC" }),
            })} · `}
          {t("source")}
        </p>
      )}
    </GlassCard>
  );
}
