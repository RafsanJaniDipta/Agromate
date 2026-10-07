"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import ExpenseForm from "@/components/dashboard/ledger/ExpenseForm";
import HarvestForm from "@/components/dashboard/ledger/HarvestForm";
import { secondaryButton } from "@/components/dashboard/formStyles";
import { useTaka } from "@/components/dashboard/useTaka";
import { deleteExpense, deleteHarvest, harvestIncome, isHarvestUnit, type Expense, type Harvest } from "@/lib/ledger";

const smallButton = `${secondaryButton} px-3 py-1.5 text-xs`;

type RowProps<T> = {
  entry: T;
  // Extra line such as the crop and field, for lists that mix several crops
  context?: string;
  onSaved: (entry: T) => void;
  onDeleted: (id: string) => void;
  onDeleteFailed: () => void;
};

// Text, amount and the edit / delete buttons, laid out the same for costs and harvests
function RowLayout({
  title,
  details,
  amount,
  onEdit,
  onDelete,
  isDeleting,
}: {
  title: string;
  details: string;
  amount: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const t = useTranslations("dashboard.myCropsPage.ledger");

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate">{title}</p>
        <p className="truncate text-xs text-white/50">{details}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="font-medium">{amount}</span>
        <button type="button" onClick={onEdit} className={smallButton}>
          {t("edit")}
        </button>
        <button type="button" onClick={onDelete} disabled={isDeleting} className={smallButton}>
          {t("delete")}
        </button>
      </div>
    </div>
  );
}

// One cost: what it was for, when, and how much; editable in place
export function ExpenseRow({ entry, context, onSaved, onDeleted, onDeleteFailed }: RowProps<Expense>) {
  const t = useTranslations("dashboard.myCropsPage.ledger");
  const format = useFormatter();
  const taka = useTaka();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isEditing) {
    return (
      <div className="py-2">
        <ExpenseForm
          target={{ farmId: entry.farmId }}
          expense={entry}
          onSaved={(saved) => {
            setIsEditing(false);
            onSaved(saved);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDelete"))) return;
    setIsDeleting(true);
    try {
      await deleteExpense(entry.id);
      onDeleted(entry.id);
    } catch {
      setIsDeleting(false);
      onDeleteFailed();
    }
  }

  return (
    <RowLayout
      title={t(`categories.${entry.category}`)}
      details={[format.dateTime(new Date(entry.date), { dateStyle: "medium" }), context, entry.description]
        .filter(Boolean)
        .join(" · ")}
      amount={taka(entry.amount)}
      onEdit={() => setIsEditing(true)}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  );
}

// One harvest: how much at what price, when, and the income; editable in place
export function HarvestRow({ entry, context, onSaved, onDeleted, onDeleteFailed }: RowProps<Harvest>) {
  const t = useTranslations("dashboard.myCropsPage.ledger");
  const format = useFormatter();
  const taka = useTaka();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (isEditing) {
    return (
      <div className="py-2">
        <HarvestForm
          cropCycleId={entry.cropCycleId}
          harvest={entry}
          onSaved={(saved) => {
            setIsEditing(false);
            onSaved(saved);
          }}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDelete"))) return;
    setIsDeleting(true);
    try {
      await deleteHarvest(entry.id);
      onDeleted(entry.id);
    } catch {
      setIsDeleting(false);
      onDeleteFailed();
    }
  }

  // Older rows may hold a unit we have no label for; show those as stored
  const unit = isHarvestUnit(entry.unit) ? t(`units.${entry.unit}`) : entry.unit;

  return (
    <RowLayout
      title={t("harvestLine", { quantity: entry.quantity, unit, price: taka(entry.pricePerUnit) })}
      details={[format.dateTime(new Date(entry.harvestDate), { dateStyle: "medium" }), context]
        .filter(Boolean)
        .join(" · ")}
      amount={taka(harvestIncome(entry))}
      onEdit={() => setIsEditing(true)}
      onDelete={handleDelete}
      isDeleting={isDeleting}
    />
  );
}
