"use client";

import { useState, type ChangeEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { darkInput, darkLabel } from "@/components/dashboard/formStyles";
import type { StoryResults } from "@/lib/successStories";

// The three results; `name` is the form field (and label key), `field` the API's percent field.
// For costs going down is good; for yield and income going up is.
export const RESULT_FIELDS = [
  { name: "yield", field: "yieldChangePercent", goodWhen: "up" },
  { name: "cost", field: "costChangePercent", goodWhen: "down" },
  { name: "income", field: "incomeChangePercent", goodWhen: "up" },
] as const;

type ResultName = (typeof RESULT_FIELDS)[number]["name"];

// Units the farmer can count the harvest in; before and after use the same one
const YIELD_UNITS = ["MAUND", "KG", "TON"] as const;

// The server accepts changes from -100% (all gone) to +1000% (eleven times as much)
const MAX_PERCENT = 1000;

// "৩০,০০০" or "30,000" → 30000; anything unreadable → NaN
function parseAmount(text: string): number {
  const asciiDigits = text.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
  const cleaned = asciiDigits.replace(/[,\s]/g, "");
  return cleaned === "" ? NaN : Number(cleaned);
}

// Whole-number percent change from before to after, or null when it can't be worked out
function percentChange(before: number, after: number): number | null {
  if (!(before > 0) || !(after >= 0)) return null;
  return Math.round(((after - before) / before) * 100);
}

type Amounts = Record<ResultName, { before: string; after: string }>;
const emptyAmounts: Amounts = {
  yield: { before: "", after: "" },
  cost: { before: "", after: "" },
  income: { before: "", after: "" },
};

// "This season's results" for a success story. By default the farmer types what they had before
// and after (maunds, taka) and the percent change is worked out for them; editing an older story,
// whose amounts weren't kept, starts in plain percent mode. Either way the form gets hidden
// "yield" / "cost" / "income" percent values, as before.
export default function StoryResultsField({ saved }: { saved: StoryResults | null }) {
  const t = useTranslations("dashboard.storiesPage.results");
  const format = useFormatter();
  const [mode, setMode] = useState<"amounts" | "percent">(saved ? "percent" : "amounts");
  const [amounts, setAmounts] = useState<Amounts>(emptyAmounts);
  const [yieldUnit, setYieldUnit] = useState<(typeof YIELD_UNITS)[number]>("MAUND");

  const percentFor = (name: ResultName) =>
    percentChange(parseAmount(amounts[name].before), parseAmount(amounts[name].after));

  // Typing Bangla or English digits is fine; the browser blocks sending until the numbers make sense
  function handleAmount(name: ResultName, side: "before" | "after", event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const next = { ...amounts[name], [side]: value };
    setAmounts((current) => ({ ...current, [name]: next }));

    const amount = parseAmount(value);
    const before = parseAmount(next.before);
    const change = percentChange(before, parseAmount(next.after));
    let problem = "";
    if (value.trim() && Number.isNaN(amount)) problem = t("errors.notNumber");
    else if (side === "before" && value.trim() && !(amount > 0)) problem = t("errors.beforeZero");
    else if (side === "after" && change !== null && change > MAX_PERCENT) problem = t("errors.tooBig");
    event.target.setCustomValidity(problem);
  }

  // One line under each row: "Yield up 33%", coloured by whether that's good news
  function summary(name: ResultName, goodWhen: "up" | "down") {
    const change = percentFor(name);
    if (change === null) return null;
    const direction = change > 0 ? "up" : change < 0 ? "down" : "same";
    const tone = direction === "same" ? "text-white/60" : direction === goodWhen ? "text-emerald-300" : "text-amber-300";
    return (
      <p className={`text-xs ${tone}`}>
        {t(`summary.${direction}`, { what: t(name), percent: format.number(Math.abs(change)) })}
      </p>
    );
  }

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className={darkLabel}>{t("title")}</legend>

      {mode === "amounts" ? (
        <>
          <p className="-mt-1 text-xs text-white/50">{t("amountsHint")}</p>
          <div className="flex flex-col gap-4">
            {RESULT_FIELDS.map(({ name, goodWhen }) => {
              const change = percentFor(name);
              return (
                <div key={name} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    {t(name)}
                    {name === "yield" ? (
                      <select
                        aria-label={t("unitLabel")}
                        value={yieldUnit}
                        onChange={(event) => setYieldUnit(event.target.value as (typeof YIELD_UNITS)[number])}
                        className="rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white outline-none focus:border-brand"
                      >
                        {YIELD_UNITS.map((unit) => (
                          <option key={unit} value={unit} className="bg-zinc-900">
                            {t(`units.${unit}`)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-white/50">(৳)</span>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input
                      required
                      inputMode="decimal"
                      aria-label={t("beforeLabel", { what: t(name) })}
                      placeholder={t("before")}
                      value={amounts[name].before}
                      onChange={(event) => handleAmount(name, "before", event)}
                      className={darkInput}
                    />
                    <span aria-hidden className="text-white/40">→</span>
                    <input
                      required
                      inputMode="decimal"
                      aria-label={t("afterLabel", { what: t(name) })}
                      placeholder={t("after")}
                      value={amounts[name].after}
                      onChange={(event) => handleAmount(name, "after", event)}
                      className={darkInput}
                    />
                  </div>
                  {summary(name, goodWhen)}
                  {/* What the form actually sends */}
                  <input type="hidden" name={name} value={change ?? ""} />
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="-mt-1 text-xs text-white/50">{t("percentHint")}</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {RESULT_FIELDS.map(({ name, field }) => (
              <label key={name} className="flex flex-col gap-2 text-sm text-white/70">
                {t(name)}
                <span className="relative">
                  <input
                    name={name}
                    type="number"
                    required
                    min={-100}
                    max={MAX_PERCENT}
                    step={1}
                    inputMode="numeric"
                    defaultValue={saved?.[field]}
                    className={`${darkInput} pr-9`}
                  />
                  <span aria-hidden className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">
                    %
                  </span>
                </span>
              </label>
            ))}
          </div>
        </>
      )}

      {/* Switch between the two ways of entering results */}
      <button
        type="button"
        onClick={() => setMode(mode === "amounts" ? "percent" : "amounts")}
        className="self-start text-xs text-white/60 underline hover:text-white"
      >
        {mode === "amounts" ? t("usePercent") : t("useAmounts")}
      </button>
    </fieldset>
  );
}
