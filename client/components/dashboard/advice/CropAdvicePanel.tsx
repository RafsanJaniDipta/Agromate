"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import FieldSelect from "@/components/dashboard/advice/FieldSelect";
import { darkInput, darkLabel, primaryButton } from "@/components/dashboard/formStyles";
import { getCropAdvice, type CropAdvice, type CropAdviceResult, type Fit, type Timing } from "@/lib/advice";
import { cropName } from "@/lib/crops";
import { SOIL_TYPES, type Farm, type SoilType } from "@/lib/farms";
import { MONTH_NUMBERS, monthKey } from "@/lib/months";

const GROUPS: Timing[] = ["NOW", "SOON", "LATER"];

const fitColor: Record<Fit, string> = {
  GOOD: "text-green-300",
  FAIR: "text-amber-200",
  POOR: "text-red-300",
  UNKNOWN: "text-white/45",
};

const currentMonth = () => new Date().getMonth() + 1;

// "Which crop to grow": pick a field (or a soil) and a month; crops come back grouped by
// whether they can be planted now, next month or later, each with the reasons.
export default function CropAdvicePanel({ farms }: { farms: Farm[] }) {
  const t = useTranslations("advice");
  const tCrop = useTranslations("advice.crop");
  const tSoil = useTranslations("dashboard.farmsPage.soils");
  const tMonths = useTranslations("months");
  const format = useFormatter();
  const locale = useLocale();

  const firstFieldId = farms.flatMap((farm) => farm.fields)[0]?.id ?? "";
  const [fieldId, setFieldId] = useState(firstFieldId);
  const [soil, setSoil] = useState<SoilType | "">("");
  const [month, setMonth] = useState(currentMonth());
  const [result, setResult] = useState<CropAdviceResult | null>(null);
  const [status, setStatus] = useState<"idle" | "working" | "error">("idle");

  async function load(input: { fieldId: string; soil: SoilType | ""; month: number }) {
    setStatus("working");
    try {
      setResult(
        await getCropAdvice({
          ...(input.fieldId ? { fieldId: input.fieldId } : {}),
          ...(input.soil ? { soilType: input.soil } : {}),
          month: input.month,
        }),
      );
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  // Advice for the first field straight away, so the page isn't empty
  useEffect(() => {
    let isCurrent = true;
    getCropAdvice({ ...(firstFieldId ? { fieldId: firstFieldId } : {}), month: currentMonth() })
      .then((advice) => isCurrent && setResult(advice))
      .catch(() => {});
    return () => {
      isCurrent = false;
    };
  }, [firstFieldId]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void load({ fieldId, soil, month });
  }

  const monthName = (value: number | null) => (value ? tMonths(monthKey(value)) : "?");
  const soilName = (value: SoilType | null) => (value ? tSoil(value) : t("soilUnknown"));

  return (
    <div className="flex flex-col gap-5">
      <DashCard>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <FieldSelect farms={farms} value={fieldId} onChange={setFieldId} />
          {/* A field brings its own soil; without one the farmer picks it */}
          <label className="flex flex-col gap-2">
            <span className={darkLabel}>{t("soil")}</span>
            <select
              value={soil}
              onChange={(event) => setSoil(event.target.value as SoilType | "")}
              disabled={Boolean(fieldId)}
              className={`${darkInput} disabled:opacity-50`}
            >
              <option value="" className="bg-zinc-900">
                {t("soilUnknown")}
              </option>
              {SOIL_TYPES.map((type) => (
                <option key={type} value={type} className="bg-zinc-900">
                  {tSoil(type)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span className={darkLabel}>{t("month")}</span>
            <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className={darkInput}>
              {MONTH_NUMBERS.map((value) => (
                <option key={value} value={value} className="bg-zinc-900">
                  {monthName(value)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={status === "working"} className={primaryButton}>
            {status === "working" ? t("working") : t("submit")}
          </button>
        </form>
        {status === "error" && <p className="mt-3 text-sm text-red-300">{t("error")}</p>}
      </DashCard>

      {result && (
        <>
          <p className="px-1 text-sm text-white/65">
            {result.averageTempC !== null
              ? tCrop("summary", {
                  month: monthName(result.month),
                  soil: soilName(result.soilType),
                  temp: `${format.number(result.averageTempC, { maximumFractionDigits: 1 })}°`,
                })
              : tCrop("summaryNoTemp", { month: monthName(result.month), soil: soilName(result.soilType) })}
          </p>
          {result.crops.length === 0 && <p className="text-sm text-white/60">{tCrop("empty")}</p>}

          {GROUPS.map((group) => {
            const crops = result.crops.filter((entry) => entry.timing === group);
            if (crops.length === 0) return null;
            return (
              <section key={group} className="flex flex-col gap-3">
                <h2 className="px-1 font-semibold">{tCrop(`groups.${group}`)}</h2>
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {crops.map((entry) => (
                    <CropAdviceCard key={entry.crop.id} entry={entry} monthName={monthName} locale={locale} />
                  ))}
                </div>
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

type CropAdviceCardProps = {
  entry: CropAdvice;
  monthName: (month: number | null) => string;
  locale: string;
};

// One crop: when to plant, how well soil and weather suit it, harvest time and market price
function CropAdviceCard({ entry, monthName, locale }: CropAdviceCardProps) {
  const tCrop = useTranslations("advice.crop");
  const format = useFormatter();
  const { crop, price } = entry;
  const tempNote = tCrop(`tempFit.${entry.tempFit}`);

  return (
    <DashCard className={`flex flex-col gap-3 ${entry.timing === "LATER" ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{cropName(crop, locale)}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${
            entry.timing === "NOW" ? "bg-brand/30 text-green-100" : entry.timing === "SOON" ? "bg-amber-300/20 text-amber-100" : "bg-white/10 text-white/60"
          }`}
        >
          {tCrop(`timing.${entry.timing}`)}
        </span>
      </div>

      <ul className="flex flex-col gap-1 text-sm">
        <li className={fitColor[entry.soilFit]}>• {tCrop(`soilFit.${entry.soilFit}`)}</li>
        {tempNote && <li className={fitColor[entry.tempFit]}>• {tempNote}</li>}
        <li className="text-white/70">
          • {tCrop("window", { from: monthName(entry.sowing.startMonth), to: monthName(entry.sowing.endMonth) })}
        </li>
        {entry.harvestBy && (
          <li className="text-white/70">
            • {tCrop("harvest", { date: format.dateTime(new Date(entry.harvestBy), { day: "numeric", month: "long" }) })}
          </li>
        )}
        {price && (
          <li className="text-white/70">
            • {tCrop("price", { min: price.minPrice, max: price.maxPrice, unit: locale === "bn" ? price.unitBn : price.unitEn })}
          </li>
        )}
      </ul>
    </DashCard>
  );
}
