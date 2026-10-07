"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@/components/icons";
import ExpenseForm from "@/components/dashboard/ledger/ExpenseForm";
import HarvestForm from "@/components/dashboard/ledger/HarvestForm";
import { ExpenseRow, HarvestRow } from "@/components/dashboard/ledger/LedgerRows";
import { secondaryButton } from "@/components/dashboard/formStyles";
import { useTaka } from "@/components/dashboard/useTaka";
import { getCropExpenses, getCropHarvests, harvestIncome, type Expense, type Harvest } from "@/lib/ledger";

type Section = "expenses" | "harvests";
const sections: Section[] = ["expenses", "harvests"];

const smallButton = `${secondaryButton} px-3 py-1.5 text-xs`;

// Replace one entry in a list after it was edited
const replaceIn = <T extends { id: string }>(list: T[] | null, saved: T) =>
  list?.map((entry) => (entry.id === saved.id ? saved : entry)) ?? null;

// A crop's costs and harvest sales, with the profit or loss so far.
// Loads only when opened, so the crop list itself stays quick.
export default function CropLedger({ cropCycleId }: { cropCycleId: string }) {
  const t = useTranslations("dashboard.myCropsPage.ledger");
  const taka = useTaka();
  const [expenses, setExpenses] = useState<Expense[] | null>(null);
  const [harvests, setHarvests] = useState<Harvest[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [section, setSection] = useState<Section>("expenses");
  const [isAdding, setIsAdding] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);

  useEffect(() => {
    Promise.all([getCropExpenses(cropCycleId), getCropHarvests(cropCycleId)])
      .then(([loadedExpenses, loadedHarvests]) => {
        setExpenses(loadedExpenses);
        setHarvests(loadedHarvests);
      })
      .catch(() => setLoadFailed(true));
  }, [cropCycleId]);

  if (loadFailed) return <p className="text-sm text-red-300">{t("loadError")}</p>;
  if (!expenses || !harvests) return <p className="text-sm text-white/60">{t("loading")}</p>;

  const totalCost = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalIncome = harvests.reduce((sum, harvest) => sum + harvestIncome(harvest), 0);
  const profit = totalIncome - totalCost;

  function switchSection(next: Section) {
    setSection(next);
    setIsAdding(false);
  }

  const totals = [
    { key: "cost", value: taka(totalCost), color: "text-white" },
    { key: "income", value: taka(totalIncome), color: "text-white" },
    {
      key: profit < 0 ? "loss" : "profit",
      value: taka(Math.abs(profit)),
      color: profit < 0 ? "text-red-300" : "text-emerald-300",
    },
  ] as const;

  return (
    <div className="flex flex-col gap-3">
      <dl className="grid grid-cols-3 gap-2 text-center">
        {totals.map(({ key, value, color }) => (
          <div key={key} className="rounded-2xl bg-white/5 px-2 py-2.5">
            <dt className="text-xs text-white/50">{t(`totals.${key}`)}</dt>
            <dd className={`text-sm font-semibold ${color}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <div role="group" aria-label={t("sectionLabel")} className="flex gap-2">
        {sections.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => switchSection(option)}
            aria-pressed={option === section}
            className={`rounded-full px-3 py-1 text-xs transition ${
              option === section ? "bg-white text-zinc-900" : "border border-white/15 text-white/70 hover:text-white"
            }`}
          >
            {t(`sections.${option}`)}
          </button>
        ))}
      </div>

      {deleteFailed && <p className="text-sm text-red-300">{t("deleteError")}</p>}

      {section === "expenses" ? (
        <>
          {expenses.length === 0 && !isAdding && <p className="text-sm text-white/60">{t("noExpenses")}</p>}
          <ul className="divide-y divide-white/10">
            {expenses.map((expense) => (
              <li key={expense.id}>
                <ExpenseRow
                  entry={expense}
                  onSaved={(saved) => setExpenses((current) => replaceIn(current, saved))}
                  onDeleted={(id) => setExpenses((current) => current?.filter((entry) => entry.id !== id) ?? null)}
                  onDeleteFailed={() => setDeleteFailed(true)}
                />
              </li>
            ))}
          </ul>
          {isAdding ? (
            <ExpenseForm
              target={{ cropCycleId }}
              onSaved={(saved) => {
                setExpenses((current) => [saved, ...(current ?? [])]);
                setIsAdding(false);
              }}
              onCancel={() => setIsAdding(false)}
            />
          ) : (
            <AddButton label={t("addExpense")} onClick={() => setIsAdding(true)} />
          )}
        </>
      ) : (
        <>
          {harvests.length === 0 && !isAdding && <p className="text-sm text-white/60">{t("noHarvests")}</p>}
          <ul className="divide-y divide-white/10">
            {harvests.map((harvest) => (
              <li key={harvest.id}>
                <HarvestRow
                  entry={harvest}
                  onSaved={(saved) => setHarvests((current) => replaceIn(current, saved))}
                  onDeleted={(id) => setHarvests((current) => current?.filter((entry) => entry.id !== id) ?? null)}
                  onDeleteFailed={() => setDeleteFailed(true)}
                />
              </li>
            ))}
          </ul>
          {isAdding ? (
            <HarvestForm
              cropCycleId={cropCycleId}
              onSaved={(saved) => {
                setHarvests((current) => [saved, ...(current ?? [])]);
                setIsAdding(false);
              }}
              onCancel={() => setIsAdding(false)}
            />
          ) : (
            <AddButton label={t("addHarvest")} onClick={() => setIsAdding(true)} />
          )}
        </>
      )}
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${smallButton} inline-flex items-center gap-1.5 self-start`}>
      <PlusIcon className="size-3.5" />
      {label}
    </button>
  );
}
