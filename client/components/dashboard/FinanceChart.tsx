"use client";

import { useId, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import { useTaka } from "@/components/dashboard/useTaka";
import type { MonthMoney } from "@/lib/dashboard";

// Series colours: lines and fills only; text always stays white/grey
const INCOME_COLOR = "#4ade80";
const EXPENSE_COLOR = "#facc15";

// Horizontal inset (in % of the plot) so the first and last points aren't cut off
const X_INSET = 3;

type Point = { x: number; y: number };

// Rounds the top of the y-axis up to a clean step (10, 20, 25, 50…), split into 4 bands
function niceTicks(maxValue: number, bands = 4): number[] {
  const rawStep = Math.max(maxValue, 1) / bands;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rawStep)!;
  return Array.from({ length: bands + 1 }, (_, index) => index * step);
}

// Smooth curve through the points; control points sit halfway between neighbours,
// so the line never overshoots above a peak or below a dip
function smoothPath(points: Point[]): string {
  return points.reduce((path, point, index) => {
    if (index === 0) return `M${point.x},${point.y}`;
    const previous = points[index - 1]!;
    const midX = (previous.x + point.x) / 2;
    return `${path} C${midX},${previous.y} ${midX},${point.y} ${point.x},${point.y}`;
  }, "");
}

type FinanceChartProps = {
  months: MonthMoney[];
  year: number;
};

// Area chart of money per month: income (solid green) against costs (dashed yellow).
// Months still to come this year are left blank. Hover or focus + arrow keys show a month's
// numbers; a hidden table lists them all.
export default function FinanceChart({ months, year }: FinanceChartProps) {
  const t = useTranslations("dashboard.finance");
  const format = useFormatter();
  const taka = useTaka();
  const gradientId = useId();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Months after this one haven't happened yet
  const now = new Date();
  const lastMonth = year < now.getFullYear() ? 12 : year > now.getFullYear() ? 0 : now.getMonth() + 1;
  const pastMonths = months.filter(({ month }) => month <= lastMonth);

  const ticks = niceTicks(Math.max(...pastMonths.flatMap((m) => [m.income, m.expenses]), 0));
  const yMax = ticks[ticks.length - 1]!;

  // Chart coordinates in a 0–100 box (y grows downward)
  const xAt = (index: number) =>
    months.length > 1 ? X_INSET + (index / (months.length - 1)) * (100 - X_INSET * 2) : 50;
  const yAt = (value: number) => 100 - (value / yMax) * 100;

  const pointsFor = (key: "income" | "expenses") =>
    pastMonths.map((m) => ({ x: xAt(m.month - 1), y: yAt(m[key]) }));
  const incomePoints = pointsFor("income");
  const expensePoints = pointsFor("expenses");
  const latestIncome = incomePoints[incomePoints.length - 1];

  const incomeLine = smoothPath(incomePoints);
  const incomeArea =
    incomePoints.length > 1 && latestIncome
      ? `${incomeLine} L${latestIncome.x},100 L${incomePoints[0]!.x},100 Z`
      : "";

  const monthName = (month: number, style: "short" | "long") =>
    format.dateTime(new Date(2000, month - 1, 1), { month: style });
  const money = (month: MonthMoney, key: "income" | "expenses") =>
    month.month <= lastMonth ? taka(month[key]) : "—";

  // Snap the crosshair to the month nearest the pointer
  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const percent = ((event.clientX - box.left) / box.width) * 100;
    const index = Math.round(((percent - X_INSET) / (100 - X_INSET * 2)) * (months.length - 1));
    setActiveIndex(Math.min(months.length - 1, Math.max(0, index)));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    setActiveIndex((current) => Math.min(months.length - 1, Math.max(0, (current ?? 0) + step)));
  }

  const active = activeIndex === null ? null : months[activeIndex];

  return (
    <DashCard className="grid gap-6 md:grid-cols-[8rem_1fr] md:p-7">
      <div>
        <p className="text-sm text-white/60">{t("eyebrow", { year })}</p>
        <h2 className="text-2xl font-semibold">{t("title")}</h2>

        {/* Line keys mirror the marks: solid for income, dashed for costs */}
        <ul className="mt-4 space-y-1.5 text-sm text-white/70">
          <li className="flex items-center gap-2">
            <span className="h-0.5 w-4 rounded-full" style={{ background: INCOME_COLOR }} />
            {t("income")}
          </li>
          <li className="flex items-center gap-2">
            <span className="w-4 border-t-2 border-dashed" style={{ borderColor: EXPENSE_COLOR }} />
            {t("expenses")}
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-[3.5rem_1fr] grid-rows-[12rem_auto] gap-x-2 gap-y-3 md:grid-rows-[13rem_auto]">
        {/* Y-axis labels */}
        <div aria-hidden className="relative text-xs tabular-nums text-white/50">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 -translate-y-1/2 whitespace-nowrap"
              style={{ top: `${yAt(tick)}%` }}
            >
              {taka(tick, { compact: true })}
            </span>
          ))}
        </div>

        {/* Plot area: hover target for the whole chart */}
        <div
          role="group"
          aria-label={t("chartLabel", { year })}
          tabIndex={0}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => setActiveIndex(null)}
          onFocus={() => setActiveIndex(Math.max(lastMonth - 1, 0))}
          onBlur={() => setActiveIndex(null)}
          onKeyDown={handleKeyDown}
          className="relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          {/* Recessive horizontal gridlines */}
          {ticks.map((tick) => (
            <span
              key={tick}
              aria-hidden
              className="absolute inset-x-0 h-px bg-white/10"
              style={{ top: `${yAt(tick)}%` }}
            />
          ))}

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 size-full overflow-visible"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={INCOME_COLOR} stopOpacity="0.3" />
                <stop offset="100%" stopColor={INCOME_COLOR} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <path
              d={smoothPath(expensePoints)}
              fill="none"
              stroke={EXPENSE_COLOR}
              strokeWidth="2"
              strokeDasharray="6 5"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            {incomeArea && <path d={incomeArea} fill={`url(#${gradientId})`} />}
            <path
              d={incomeLine}
              fill="none"
              stroke={INCOME_COLOR}
              strokeWidth="2"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Marker on the latest month; HTML so it stays round when the SVG stretches */}
          {latestIncome && (
            <span
              aria-hidden
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-black/70"
              style={{ left: `${latestIncome.x}%`, top: `${latestIncome.y}%`, background: INCOME_COLOR }}
            />
          )}

          {/* Crosshair + tooltip for the hovered / focused month */}
          {active && activeIndex !== null && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 w-px bg-white/40"
                style={{ left: `${xAt(activeIndex)}%` }}
              />
              <div
                aria-live="polite"
                className="pointer-events-none absolute top-0 z-10 w-40 rounded-xl border border-white/15 bg-zinc-950/90 p-3 text-xs shadow-lg backdrop-blur-md"
                style={{
                  left: `clamp(0%, calc(${xAt(activeIndex)}% - 5rem), calc(100% - 10rem))`,
                }}
              >
                <p className="text-white/60">{monthName(active.month, "long")}</p>
                <p className="mt-1.5 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-white/60">
                    <span className="h-0.5 w-3 rounded-full" style={{ background: INCOME_COLOR }} />
                    {t("income")}
                  </span>
                  <span className="font-semibold text-white">{money(active, "income")}</span>
                </p>
                <p className="mt-1 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-white/60">
                    <span className="w-3 border-t-2 border-dashed" style={{ borderColor: EXPENSE_COLOR }} />
                    {t("expenses")}
                  </span>
                  <span className="font-semibold text-white">{money(active, "expenses")}</span>
                </p>
              </div>
            </>
          )}
        </div>

        {/* X-axis month labels; every other one is hidden on phones to avoid crowding */}
        <div aria-hidden className="relative col-start-2 h-5 text-xs text-white/50">
          {months.map(({ month }, index) => (
            <span
              key={month}
              className={`absolute -translate-x-1/2 ${index % 2 ? "hidden sm:block" : ""}`}
              style={{ left: `${xAt(index)}%` }}
            >
              {monthName(month, "short")}
            </span>
          ))}
        </div>
      </div>

      {/* Same numbers as a table, for screen readers */}
      <table className="sr-only">
        <caption>{t("chartLabel", { year })}</caption>
        <thead>
          <tr>
            <th scope="col">{t("month")}</th>
            <th scope="col">{t("income")}</th>
            <th scope="col">{t("expenses")}</th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr key={month.month}>
              <th scope="row">{monthName(month.month, "long")}</th>
              <td>{money(month, "income")}</td>
              <td>{money(month, "expenses")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashCard>
  );
}
