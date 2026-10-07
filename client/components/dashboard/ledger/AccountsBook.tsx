"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { PlusIcon } from "@/components/icons";
import DashCard from "@/components/dashboard/DashCard";
import FormRow from "@/components/dashboard/FormRow";
import ExpenseForm from "@/components/dashboard/ledger/ExpenseForm";
import { ExpenseRow, HarvestRow } from "@/components/dashboard/ledger/LedgerRows";
import { darkInput, primaryButton } from "@/components/dashboard/formStyles";
import { useTaka } from "@/components/dashboard/useTaka";
import { cropName } from "@/lib/crops";
import { getFarms, type Farm } from "@/lib/farms";
import { getExpenses, getHarvests, harvestIncome, type DateRange, type Expense, type Harvest } from "@/lib/ledger";
import { MONTH_NUMBERS, monthKey } from "@/lib/months";

// This year and the two before it
const YEARS_SHOWN = 3;

type Section = "expenses" | "harvests";
const sections: Section[] = ["expenses", "harvests"];

// First and last day of a year, or of one month in it (month 0 = the whole year)
function rangeFor(year: number, month: number): DateRange {
  if (month === 0) return { from: `${year}-01-01`, to: `${year}-12-31` };
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, "0");
  return { from: `${year}-${mm}-01`, to: `${year}-${mm}-${lastDay}` };
}

const replaceIn = <T extends { id: string }>(list: T[], saved: T) =>
  list.map((entry) => (entry.id === saved.id ? saved : entry));

type Books = { expenses: Expense[]; harvests: Harvest[] };

// Every cost and sale across the farmer's places for a year or month, with totals.
// Entries can be corrected or removed here; costs of a whole place (not one crop) are added here.
export default function AccountsBook() {
  const t = useTranslations("dashboard.accountsPage");
  const tMonth = useTranslations("months");
  const locale = useLocale();
  const taka = useTaka();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  // 0 means the whole year
  const [month, setMonth] = useState(0);
  const [books, setBooks] = useState<Books | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [section, setSection] = useState<Section>("expenses");
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);

  useEffect(() => {
    getFarms().then(setFarms).catch(() => {});
  }, []);

  useEffect(() => {
    // Ignores an older answer that arrives after another period was picked
    let isCurrent = true;
    const range = rangeFor(year, month);
    Promise.all([getExpenses(range), getHarvests(range)])
      .then(([expenses, harvests]) => {
        if (!isCurrent) return;
        setBooks({ expenses, harvests });
        setLoadFailed(false);
      })
      .catch(() => isCurrent && setLoadFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [year, month]);

  const years = Array.from({ length: YEARS_SHOWN }, (_, index) => thisYear - index);
  const totalCost = books?.expenses.reduce((sum, expense) => sum + expense.amount, 0) ?? 0;
  const totalIncome = books?.harvests.reduce((sum, harvest) => sum + harvestIncome(harvest), 0) ?? 0;
  const profit = totalIncome - totalCost;

  // "Wheat · North field" for crop entries, "Whole place · East para" for place-wide costs
  const expenseContext = (expense: Expense) =>
    expense.cropCycle
      ? `${cropName(expense.cropCycle.crop, locale)} · ${expense.cropCycle.field.name}`
      : t("wholePlace", { place: expense.farm?.name ?? "" });
  const harvestContext = (harvest: Harvest) =>
    harvest.cropCycle ? `${cropName(harvest.cropCycle.crop, locale)} · ${harvest.cropCycle.field.name}` : undefined;

  const updateBooks = (change: (current: Books) => Books) => setBooks((current) => current && change(current));

  function pickPeriod(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
    setBooks(null);
  }

  const totals = [
    { key: "expenses", value: taka(totalCost), color: "" },
    { key: "income", value: taka(totalIncome), color: "" },
    {
      key: profit < 0 ? "loss" : "profit",
      value: taka(Math.abs(profit)),
      color: profit < 0 ? "text-red-400" : "text-green-400",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      {/* Period: year pills and a month picker */}
      <DashCard className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div role="group" aria-label={t("yearLabel")} className="flex flex-wrap gap-2">
          {years.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => pickPeriod(option, month)}
              aria-pressed={option === year}
              className={`rounded-full px-4 py-1.5 text-sm transition ${
                option === year ? "bg-white text-zinc-900" : "border border-white/15 text-white/70 hover:text-white"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <div className="sm:w-56">
          <FormRow id="accounts-month" label={t("monthLabel")}>
            <select
              id="accounts-month"
              value={month}
              onChange={(event) => pickPeriod(year, Number(event.target.value))}
              className={`${darkInput} py-2.5`}
            >
              <option value={0} className="bg-zinc-900">
                {t("wholeYear")}
              </option>
              {MONTH_NUMBERS.map((number) => (
                <option key={number} value={number} className="bg-zinc-900">
                  {tMonth(monthKey(number))}
                </option>
              ))}
            </select>
          </FormRow>
        </div>
      </DashCard>

      {loadFailed && (
        <DashCard>
          <p className="text-sm text-red-300">{t("loadError")}</p>
        </DashCard>
      )}

      {books && (
        <dl className="grid gap-5 sm:grid-cols-3">
          {totals.map(({ key, value, color }) => (
            <DashCard key={key}>
              <dt className="text-sm text-white/60">{t(`totals.${key}`)}</dt>
              <dd className={`mt-2 text-3xl font-semibold tracking-tight ${color}`}>{value}</dd>
            </DashCard>
          ))}
        </dl>
      )}

      <DashCard className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label={t("sectionLabel")} className="flex gap-2">
            {sections.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setSection(option);
                  setAddingFor(null);
                }}
                aria-pressed={option === section}
                className={`rounded-full px-4 py-1.5 text-sm transition ${
                  option === section ? "bg-white text-zinc-900" : "border border-white/15 text-white/70 hover:text-white"
                }`}
              >
                {t(`sections.${option}`)}
              </button>
            ))}
          </div>

          {/* Costs of a whole place are added here; a crop's own costs are added on its card */}
          {section === "expenses" && farms.length > 0 && addingFor === null && (
            <button
              type="button"
              onClick={() => setAddingFor(farms[0]!.id)}
              className={`${primaryButton} inline-flex items-center gap-2 px-4 py-2`}
            >
              <PlusIcon className="size-4" />
              {t("addPlaceCost")}
            </button>
          )}
        </div>

        {section === "expenses" && addingFor !== null && (
          <div className="flex flex-col gap-3">
            <FormRow id="accounts-place" label={t("placeLabel")}>
              <select
                id="accounts-place"
                value={addingFor}
                onChange={(event) => setAddingFor(event.target.value)}
                className={`${darkInput} py-2.5`}
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id} className="bg-zinc-900">
                    {farm.name}
                  </option>
                ))}
              </select>
            </FormRow>
            <ExpenseForm
              key={addingFor}
              target={{ farmId: addingFor }}
              onSaved={(saved) => {
                // Shown again only if it falls in the period being viewed
                const { from, to } = rangeFor(year, month);
                const day = saved.date.slice(0, 10);
                const farm = farms.find(({ id }) => id === saved.farmId);
                if (day >= from && day <= to) {
                  updateBooks((current) => ({
                    ...current,
                    expenses: [{ ...saved, farm: farm && { id: farm.id, name: farm.name } }, ...current.expenses],
                  }));
                }
                setAddingFor(null);
              }}
              onCancel={() => setAddingFor(null)}
            />
            <p className="text-xs text-white/50">{t("cropCostHint")}</p>
          </div>
        )}

        {deleteFailed && <p className="text-sm text-red-300">{t("deleteError")}</p>}
        {!books && !loadFailed && <p className="text-sm text-white/60">{t("loading")}</p>}

        {books && section === "expenses" && (
          <>
            {books.expenses.length === 0 && <p className="text-sm text-white/60">{t("noExpenses")}</p>}
            <ul className="divide-y divide-white/10">
              {books.expenses.map((expense) => (
                <li key={expense.id}>
                  <ExpenseRow
                    entry={expense}
                    context={expenseContext(expense)}
                    // The edit response has no place or crop names; keep the ones already shown
                    onSaved={(saved) =>
                      updateBooks((current) => ({
                        ...current,
                        expenses: replaceIn(current.expenses, { ...expense, ...saved }),
                      }))
                    }
                    onDeleted={(id) =>
                      updateBooks((current) => ({ ...current, expenses: current.expenses.filter((e) => e.id !== id) }))
                    }
                    onDeleteFailed={() => setDeleteFailed(true)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        {books && section === "harvests" && (
          <>
            {books.harvests.length === 0 && <p className="text-sm text-white/60">{t("noHarvests")}</p>}
            <ul className="divide-y divide-white/10">
              {books.harvests.map((harvest) => (
                <li key={harvest.id}>
                  <HarvestRow
                    entry={harvest}
                    context={harvestContext(harvest)}
                    onSaved={(saved) =>
                      updateBooks((current) => ({
                        ...current,
                        harvests: replaceIn(current.harvests, { ...harvest, ...saved }),
                      }))
                    }
                    onDeleted={(id) =>
                      updateBooks((current) => ({ ...current, harvests: current.harvests.filter((h) => h.id !== id) }))
                    }
                    onDeleteFailed={() => setDeleteFailed(true)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </DashCard>
    </div>
  );
}
