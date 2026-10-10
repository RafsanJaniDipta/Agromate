"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ChartIcon } from "@/components/icons";
import DashCard from "@/components/dashboard/DashCard";
import { itemName, itemUnit, type PriceItem } from "@/lib/prices";

type PriceTableProps = {
  items: PriceItem[];
  isMyCrop: (item: PriceItem) => boolean;
  onReport: (item: PriceItem) => void;
  // Crops have daily prices worth a chart
  onShowTrend: (item: PriceItem) => void;
};

// The price list as a table: official price, weekly change, where it's from, and what farmers
// report. On phones it scrolls sideways.
export default function PriceTable({ items, isMyCrop, onReport, onShowTrend }: PriceTableProps) {
  const t = useTranslations("prices");
  const tMarket = useTranslations("market");
  const format = useFormatter();
  const locale = useLocale();

  const amount = (min: number, max: number) =>
    min === max ? tMarket("price", { price: min }) : tMarket("priceRange", { min, max });
  const percent = (change: number) =>
    format.number(Math.abs(change) / 100, { style: "percent", maximumFractionDigits: 1 });
  const day = (date: string) => format.dateTime(new Date(date), { day: "numeric", month: "short", timeZone: "UTC" });

  // The chosen district's figure, or the whole country's when the district has none yet
  function farmerReports({ reports }: PriceItem) {
    const district = (locale === "bn" ? reports.districtBn : reports.district) ?? reports.district;
    if (district && reports.districtMedian !== null) {
      return {
        price: tMarket("price", { price: Math.round(reports.districtMedian) }),
        note: `${district} · ${t("table.reporters", { count: reports.districtCount })}`,
      };
    }
    if (reports.nationalMedian !== null) {
      const note = [t("table.nationwide"), t("table.reporters", { count: reports.nationalCount })];
      if (district) note.unshift(t("table.noneIn", { district }));
      return {
        price: tMarket("price", { price: Math.round(reports.nationalMedian) }),
        note: note.join(" · "),
      };
    }
    return null;
  }

  const headCell = "px-4 py-3 text-left text-xs font-medium text-white/55";
  const cell = "px-4 py-3 align-top";

  return (
    <DashCard className="overflow-hidden p-0">
      <div data-lenis-prevent className="overflow-x-auto">
        <table className="w-full min-w-4xl border-collapse text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <th scope="col" className={headCell}>{t("table.item")}</th>
              <th scope="col" className={headCell}>{t("table.price")}</th>
              <th scope="col" className={headCell}>{t("table.change")}</th>
              <th scope="col" className={headCell}>{t("table.source")}</th>
              <th scope="col" className={headCell}>{t("table.farmers")}</th>
              <th scope="col" className={headCell}>
                <span className="sr-only">{t("table.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {items.map((item) => {
              const { official, weekChangePercent } = item;
              const reports = farmerReports(item);
              const mine = isMyCrop(item);
              return (
                <tr key={item.id} className="transition hover:bg-white/5">
                  <th scope="row" className={`${cell} text-left font-normal`}>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{itemName(item, locale)}</span>
                      {mine && (
                        <span className="rounded-full bg-brand/25 px-2 py-0.5 text-[10px] text-green-200">{t("yourCrop")}</span>
                      )}
                    </span>
                    {item.details && <span className="mt-0.5 block text-xs text-white/45">{item.details}</span>}
                  </th>

                  <td className={`${cell} whitespace-nowrap`}>
                    {official ? (
                      <>
                        <span className="font-semibold">{amount(official.minPrice, official.maxPrice)}</span>
                        <span className="text-white/50"> {t("per", { unit: itemUnit(item, locale) })}</span>
                      </>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>

                  <td className={`${cell} whitespace-nowrap text-xs`}>
                    {weekChangePercent === null ? (
                      <span className="text-white/40">—</span>
                    ) : weekChangePercent > 0 ? (
                      <span className="text-lime-400">▲ {percent(weekChangePercent)}</span>
                    ) : weekChangePercent < 0 ? (
                      <span className="text-red-400">▼ {percent(weekChangePercent)}</span>
                    ) : (
                      <span className="text-white/50">— {percent(0)}</span>
                    )}
                  </td>

                  <td className={`${cell} text-xs text-white/60`}>
                    {official ? (
                      <>
                        <span className="block">{t(`source.${official.source}`)}</span>
                        <span className="block text-white/40">{day(official.date)}</span>
                      </>
                    ) : (
                      t("noOfficial")
                    )}
                  </td>

                  <td className={`${cell} text-xs`}>
                    {reports ? (
                      <>
                        <span className="block text-sm font-medium">{reports.price}</span>
                        <span className="block text-white/45">{reports.note}</span>
                      </>
                    ) : (
                      <span className="text-white/40">{t("reports.none")}</span>
                    )}
                  </td>

                  <td className={`${cell} whitespace-nowrap text-right`}>
                    <span className="inline-flex items-center gap-2">
                      {item.category === "CROP" && official && (
                        <button
                          type="button"
                          onClick={() => onShowTrend(item)}
                          aria-label={`${t("trendButton")}: ${itemName(item, locale)}`}
                          title={t("trendButton")}
                          className="grid size-9 place-items-center rounded-full border border-white/15 text-white/75 transition hover:bg-white/10 hover:text-white"
                        >
                          <ChartIcon className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onReport(item)}
                        className="rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-white/85"
                      >
                        {t("report.button")}
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashCard>
  );
}
