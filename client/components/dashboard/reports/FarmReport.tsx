"use client";

import { useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { darkInput, darkLabel, primaryButton } from "@/components/dashboard/formStyles";
import { cropName } from "@/lib/crops";
import { getCropReport, getYearReport, type CategoryAmount, type CropReport, type YearReport } from "@/lib/reports";

const thisYear = () => new Date().getFullYear();

// A year's (or one crop's) costs, harvests, sales and profit, laid out to print well:
// the dashboard frame and these controls are hidden on paper (see "print-report" in globals.css).
export default function FarmReport() {
  const t = useTranslations("reports");
  const tCategory = useTranslations("dashboard.myCropsPage.ledger.categories");
  const tStatus = useTranslations("dashboard.myCropsPage.statuses");
  const tUnit = useTranslations("dashboard.myCropsPage.ledger.units");
  const format = useFormatter();
  const locale = useLocale();
  const me = useCurrentUser();

  const [year, setYear] = useState(thisYear());
  const [cropId, setCropId] = useState("");
  const [yearReport, setYearReport] = useState<YearReport | null>(null);
  const [cropReport, setCropReport] = useState<CropReport | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    getYearReport(year)
      .then((report) => {
        if (!isCurrent) return;
        setYearReport(report);
        setFailed(false);
      })
      .catch(() => isCurrent && setFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [year]);

  useEffect(() => {
    if (!cropId) return;
    let isCurrent = true;
    getCropReport(cropId)
      .then((report) => isCurrent && setCropReport(report))
      .catch(() => isCurrent && setFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [cropId]);

  function chooseYear(value: number) {
    setYear(value);
    setCropId("");
    setCropReport(null);
  }

  const money = (value: number) => `৳${format.number(Math.round(value))}`;
  const day = (date: string | null) => (date ? format.dateTime(new Date(date), { dateStyle: "medium" }) : "—");
  const unit = (value: string) => (["KG", "MAUND", "TON"].includes(value) ? tUnit(value as "KG") : value);
  const years = [...new Set([thisYear(), ...(yearReport?.years ?? [])])].sort((a, b) => b - a);
  const shownCrop = cropId && cropReport?.id === cropId ? cropReport : null;

  const cell = "py-2 pr-4 align-top";
  const head = "py-2 pr-4 text-left text-xs font-medium text-white/55";

  // Cost, sales and profit (or loss) side by side
  const totals = (cost: number, revenue: number, profit: number) => (
    <dl className="grid gap-3 sm:grid-cols-3">
      {[
        { label: t("totals.cost"), value: money(cost) },
        { label: t("totals.revenue"), value: money(revenue) },
        { label: profit < 0 ? t("totals.loss") : t("totals.profit"), value: money(Math.abs(profit)), tone: profit < 0 ? "text-red-300" : "text-green-300" },
      ].map((entry) => (
        <div key={entry.label} className="rounded-2xl border border-white/10 p-4">
          <dt className="text-xs text-white/55">{entry.label}</dt>
          <dd className={`mt-1 text-2xl font-semibold ${entry.tone ?? ""}`}>{entry.value}</dd>
        </div>
      ))}
    </dl>
  );

  const categoryTable = (rows: CategoryAmount[]) =>
    rows.length === 0 ? (
      <p className="text-sm text-white/50">{t("noLines")}</p>
    ) : (
      <table className="w-full border-collapse text-sm">
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr key={row.category}>
              <th scope="row" className={`${cell} text-left font-normal`}>{tCategory(row.category as "SEEDS")}</th>
              <td className={`${cell} text-right font-medium`}>{money(row.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-4 px-1 print:hidden lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/60">{t("intro")}</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className={darkLabel}>{t("year")}</span>
            <select value={year} onChange={(event) => chooseYear(Number(event.target.value))} className={darkInput}>
              {years.map((value) => (
                <option key={value} value={value} className="bg-zinc-900">
                  {format.number(value, { useGrouping: false })}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={darkLabel}>{t("crop")}</span>
            <select value={cropId} onChange={(event) => setCropId(event.target.value)} className={darkInput}>
              <option value="" className="bg-zinc-900">
                {t("allCrops")}
              </option>
              {yearReport?.crops.map((crop) => (
                <option key={crop.id} value={crop.id} className="bg-zinc-900">
                  {cropName(crop.crop, locale)} · {crop.field.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => window.print()} className={primaryButton}>
            {t("print")}
          </button>
        </div>
      </header>

      {failed && <p className="text-sm text-red-300">{t("error")}</p>}
      {!failed && !yearReport && <p className="text-sm text-white/60">{t("loading")}</p>}

      {yearReport && (
        <article className="print-report flex flex-col gap-6 rounded-3xl border border-white/10 bg-black/40 p-5 backdrop-blur-xl md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-4">
            <div>
              <h2 className="text-xl font-semibold">
                {t("title")} · {shownCrop ? `${cropName(shownCrop.crop, locale)} (${shownCrop.field.name})` : format.number(year, { useGrouping: false })}
              </h2>
              <p className="text-sm text-white/60">{me.name}</p>
            </div>
            <p className="text-xs text-white/45">{t("generated", { date: format.dateTime(new Date(), { dateStyle: "long" }) })}</p>
          </div>

          {shownCrop ? (
            <>
              <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {[
                  [t("columns.field"), `${shownCrop.field.name} · ${shownCrop.farm.name}`],
                  [t("columns.planted"), day(shownCrop.plantingDate)],
                  [t("columns.status"), tStatus(shownCrop.status as "PLANNED")],
                  [t("harvestedQuantity"), shownCrop.sales.quantities.map((q) => `${format.number(q.quantity)} ${unit(q.unit)}`).join(", ") || "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-white/50">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>

              {totals(shownCrop.costs.total, shownCrop.sales.revenue, shownCrop.profit)}

              <section>
                <h3 className="mb-2 font-semibold">{t("expenses")}</h3>
                {shownCrop.expenses?.length ? (
                  <table className="w-full border-collapse text-sm">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th scope="col" className={head}>{t("columns.date")}</th>
                        <th scope="col" className={head}>{t("columns.type")}</th>
                        <th scope="col" className={head}>{t("columns.note")}</th>
                        <th scope="col" className={`${head} text-right`}>{t("columns.amount")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {shownCrop.expenses.map((expense, index) => (
                        <tr key={index}>
                          <td className={cell}>{day(expense.date)}</td>
                          <td className={cell}>{tCategory(expense.category as "SEEDS")}</td>
                          <td className={`${cell} text-white/70`}>{expense.description ?? ""}</td>
                          <td className={`${cell} text-right`}>{money(expense.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-white/50">{t("noLines")}</p>
                )}
              </section>

              <section>
                <h3 className="mb-2 font-semibold">{t("harvests")}</h3>
                {shownCrop.harvests?.length ? (
                  <table className="w-full border-collapse text-sm">
                    <thead className="border-b border-white/10">
                      <tr>
                        <th scope="col" className={head}>{t("columns.date")}</th>
                        <th scope="col" className={head}>{t("columns.quantity")}</th>
                        <th scope="col" className={head}>{t("columns.price")}</th>
                        <th scope="col" className={`${head} text-right`}>{t("columns.revenue")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {shownCrop.harvests.map((harvest, index) => (
                        <tr key={index}>
                          <td className={cell}>{day(harvest.harvestDate)}</td>
                          <td className={cell}>{format.number(harvest.quantity)} {unit(harvest.unit)}</td>
                          <td className={cell}>{money(harvest.pricePerUnit)}/{unit(harvest.unit)}</td>
                          <td className={`${cell} text-right`}>{money(harvest.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-white/50">{t("noLines")}</p>
                )}
              </section>
            </>
          ) : (
            <>
              {totals(yearReport.totals.cost, yearReport.totals.revenue, yearReport.totals.profit)}

              <section>
                <h3 className="mb-2 font-semibold">{t("crops")}</h3>
                {yearReport.crops.length === 0 ? (
                  <p className="text-sm text-white/50">{t("empty", { year: format.number(year, { useGrouping: false }) })}</p>
                ) : (
                  <div data-lenis-prevent className="overflow-x-auto">
                    <table className="w-full min-w-2xl border-collapse text-sm">
                      <thead className="border-b border-white/10">
                        <tr>
                          <th scope="col" className={head}>{t("columns.crop")}</th>
                          <th scope="col" className={head}>{t("columns.field")}</th>
                          <th scope="col" className={head}>{t("columns.planted")}</th>
                          <th scope="col" className={head}>{t("columns.status")}</th>
                          <th scope="col" className={`${head} text-right`}>{t("columns.cost")}</th>
                          <th scope="col" className={`${head} text-right`}>{t("columns.revenue")}</th>
                          <th scope="col" className={`${head} text-right`}>{t("columns.profit")}</th>
                          <th scope="col" className={`${head} text-right`}>{t("columns.perAcre")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {yearReport.crops.map((crop) => (
                          <tr key={crop.id}>
                            <th scope="row" className={`${cell} text-left font-medium`}>{cropName(crop.crop, locale)}</th>
                            <td className={cell}>{crop.field.name}</td>
                            <td className={cell}>{day(crop.plantingDate)}</td>
                            <td className={cell}>{tStatus(crop.status as "PLANNED")}</td>
                            <td className={`${cell} text-right`}>{money(crop.costs.total)}</td>
                            <td className={`${cell} text-right`}>{money(crop.sales.revenue)}</td>
                            <td className={`${cell} text-right font-medium ${crop.profit < 0 ? "text-red-300" : ""}`}>{money(crop.profit)}</td>
                            <td className={`${cell} text-right text-white/70`}>{crop.perAcre.profit === null ? "—" : money(crop.perAcre.profit)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <section>
                  <h3 className="mb-2 font-semibold">{t("costsByCategory")}</h3>
                  {categoryTable(yearReport.totals.costsByCategory)}
                </section>
                <section>
                  <h3 className="mb-2 font-semibold">{t("otherCosts")}</h3>
                  {categoryTable(yearReport.otherCosts.byCategory)}
                </section>
              </div>
            </>
          )}
        </article>
      )}
    </div>
  );
}
