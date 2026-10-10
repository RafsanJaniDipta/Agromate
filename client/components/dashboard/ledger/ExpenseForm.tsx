"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import FormRow from "@/components/dashboard/FormRow";
import { darkInput, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { toDateInput, todayDateInput } from "@/lib/cropCycles";
import {
  EXPENSE_CATEGORIES,
  addExpense,
  updateExpense,
  type Expense,
  type ExpenseCategory,
  type ExpenseTarget,
} from "@/lib/ledger";

type ExpenseFormProps = {
  // Where a new cost goes: a crop or a whole place. Ignored when editing.
  target: ExpenseTarget;
  // The cost being edited, or left out to add a new one
  expense?: Expense;
  onSaved: (expense: Expense) => void;
  onCancel: () => void;
};

// Small form to record one cost, or correct one: what it was for, how much and when.
export default function ExpenseForm({ target, expense, onSaved, onCancel }: ExpenseFormProps) {
  const t = useTranslations("dashboard.myCropsPage.ledger");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const idPrefix = `expense-${expense?.id ?? ("cropCycleId" in target ? target.cropCycleId : target.farmId)}`;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const note = String(data.get("description") ?? "").trim();
    const input = {
      category: String(data.get("category")) as ExpenseCategory,
      amount: Number(data.get("amount")),
      date: String(data.get("date")),
      description: note || undefined,
    };

    setStatus("saving");
    try {
      onSaved(expense ? await updateExpense(expense.id, input) : await addExpense(target, input));
    } catch {
      setStatus("error");
    }
  }

  const isSaving = status === "saving";
  const saveLabel = expense ? (isSaving ? t("saving") : t("save")) : isSaving ? t("adding") : t("add");

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <FormRow id={`${idPrefix}-category`} label={t("fields.category")}>
          <select
            id={`${idPrefix}-category`}
            name="category"
            defaultValue={expense?.category ?? "SEEDS"}
            className={darkInput}
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category} className="bg-zinc-900">
                {t(`categories.${category}`)}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow id={`${idPrefix}-amount`} label={t("fields.amount")}>
          <input
            id={`${idPrefix}-amount`}
            name="amount"
            type="number"
            min={1}
            step="1"
            required
            inputMode="numeric"
            defaultValue={expense?.amount}
            className={darkInput}
          />
        </FormRow>
        <FormRow id={`${idPrefix}-date`} label={t("fields.date")}>
          <input
            id={`${idPrefix}-date`}
            name="date"
            type="date"
            required
            defaultValue={expense ? toDateInput(expense.date) : todayDateInput()}
            className={darkInput}
          />
        </FormRow>
      </div>
      <FormRow id={`${idPrefix}-note`} label={`${t("fields.note")} (${t("optional")})`}>
        <input
          id={`${idPrefix}-note`}
          name="description"
          maxLength={200}
          defaultValue={expense?.description ?? ""}
          placeholder={t("notePlaceholder")}
          className={darkInput}
        />
      </FormRow>

      {status === "error" && <p className="text-sm text-red-300">{t("saveError")}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={isSaving} className={`${primaryButton} px-4 py-2 text-xs`}>
          {saveLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={isSaving} className={`${secondaryButton} px-4 py-2 text-xs`}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
