"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import FieldSelect from "@/components/dashboard/advice/FieldSelect";
import { darkInput, darkLabel, primaryButton } from "@/components/dashboard/formStyles";
import { ApiError } from "@/lib/api";
import { FERTILITY_LEVELS, getFertilizerAdvice, type Fertility, type FertilizerAdvice, type Range } from "@/lib/advice";
import { cropName, getCrops, type Crop } from "@/lib/crops";
import type { Farm } from "@/lib/farms";

type Status = "idle" | "working" | "error" | "noGuide" | "needArea";

// "How much fertilizer": crop + field (or acres) + soil fertility → each fertilizer in kg,
// 50 kg bags and per bigha, with the cost at today's prices, when to apply and the source.
export default function FertilizerAdvicePanel({ farms }: { farms: Farm[] }) {
  const t = useTranslations("advice");
  const tFert = useTranslations("advice.fertilizer");
  const tMarket = useTranslations("market");
  const format = useFormatter();
  const locale = useLocale();

  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropId, setCropId] = useState("");
  const [fieldId, setFieldId] = useState(farms.flatMap((farm) => farm.fields)[0]?.id ?? "");
  const [acres, setAcres] = useState("");
  const [fertility, setFertility] = useState<Fertility>("MEDIUM");
  const [advice, setAdvice] = useState<FertilizerAdvice | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    getCrops()
      .then((list) => {
        setCrops(list);
        setCropId((current) => current || list[0]?.id || "");
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!fieldId && !(Number(acres) > 0)) return setStatus("needArea");

    setStatus("working");
    try {
      setAdvice(
        await getFertilizerAdvice({
          cropId,
          fertility,
          ...(fieldId ? { fieldId } : {}),
          ...(Number(acres) > 0 ? { areaAcres: Number(acres) } : {}),
        }),
      );
      setStatus("idle");
    } catch (error) {
      setAdvice(null);
      setStatus(error instanceof ApiError && error.status === 404 ? "noGuide" : error instanceof ApiError && error.status === 422 ? "needArea" : "error");
    }
  }

  // "120 kg" or "100–130 kg"
  const number = (value: number) => format.number(value, { maximumFractionDigits: 1 });
  const range = ({ min, max }: Range) => (min === max ? number(min) : `${number(min)}–${number(max)}`);
  const kg = (value: Range) => tFert("kg", { value: range(value) });
  const taka = (value: Range) =>
    value.min === value.max ? tMarket("price", { price: Math.round(value.min) }) : `৳${number(Math.round(value.min))}–${number(Math.round(value.max))}`;

  const chip = (isActive: boolean) =>
    `rounded-full px-3.5 py-2 text-sm transition ${
      isActive ? "bg-white text-zinc-900" : "border border-white/15 text-white/80 hover:bg-white/10"
    }`;

  const errorText = {
    error: t("error"),
    noGuide: tFert("noGuide"),
    needArea: tFert("needArea"),
  } as Partial<Record<Status, string>>;

  return (
    <div className="flex flex-col gap-5">
      <DashCard>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className={darkLabel}>{tFert("crop")}</span>
              <select value={cropId} onChange={(event) => setCropId(event.target.value)} required className={darkInput}>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id} className="bg-zinc-900">
                    {cropName(crop, locale)}
                  </option>
                ))}
              </select>
            </label>
            <FieldSelect farms={farms} value={fieldId} onChange={setFieldId} />
            {/* The field's own size is used unless the farmer types another */}
            <label className="flex flex-col gap-2">
              <span className={darkLabel}>{tFert("area")}</span>
              <input
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={acres}
                onChange={(event) => setAcres(event.target.value)}
                placeholder={tFert("areaHint")}
                className={darkInput}
              />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className={darkLabel}>{tFert("fertility")}</span>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {FERTILITY_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={fertility === level}
                  onClick={() => setFertility(level)}
                  className={chip(fertility === level)}
                >
                  {tFert(`fertilityLevels.${level}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={status === "working" || !cropId} className={primaryButton}>
              {status === "working" ? t("working") : t("submit")}
            </button>
            {errorText[status] && <p className="text-sm text-red-300">{errorText[status]}</p>}
          </div>
        </form>
      </DashCard>

      {advice && (
        <DashCard className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">
            {tFert("resultTitle", { crop: cropName(advice.crop, locale), area: advice.areaAcres })}
            {advice.field && <span className="text-sm font-normal text-white/55"> · {advice.field.name}</span>}
          </h2>

          <div data-lenis-prevent className="overflow-x-auto">
            <table className="w-full min-w-xl border-collapse text-sm">
              <thead className="border-b border-white/10 text-left text-xs text-white/55">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">{tFert("table.fertilizer")}</th>
                  <th scope="col" className="py-2 pr-4 font-medium">{tFert("table.total")}</th>
                  <th scope="col" className="py-2 pr-4 font-medium">{tFert("table.bags")}</th>
                  <th scope="col" className="py-2 pr-4 font-medium">{tFert("table.perBigha")}</th>
                  <th scope="col" className="py-2 font-medium">{tFert("table.cost")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {advice.items.map((item) => (
                  <tr key={item.fertilizer}>
                    <th scope="row" className="py-2.5 pr-4 text-left font-medium">{tFert(`names.${item.fertilizer}`)}</th>
                    <td className="py-2.5 pr-4 font-semibold">{kg(item.total)}</td>
                    <td className="py-2.5 pr-4 text-white/75">{range(item.bags)}</td>
                    <td className="py-2.5 pr-4 text-white/75">{kg(item.perBigha)}</td>
                    <td className="py-2.5 text-white/75">{item.cost ? taka(item.cost) : tFert("noPrice")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {advice.totalCost && (
            <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm">
              {tFert("totalCost")}: <span className="font-semibold">{taka(advice.totalCost)}</span>
            </p>
          )}
          {advice.organic && <p className="text-sm text-white/75">{tFert("organic", { total: Math.round(advice.organic.total.max * 10) / 10 })}</p>}

          <div>
            <h3 className="text-xs font-medium text-white/50">{tFert("timing")}</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/80">{locale === "bn" ? advice.timing.bn : advice.timing.en}</p>
          </div>

          <p className="text-xs text-white/45">
            {tFert("source")}:{" "}
            <a href={advice.source.url} target="_blank" rel="noreferrer" className="underline hover:text-white/70">
              {advice.source.name}
            </a>
          </p>
          <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-xs text-amber-100">{tFert("note")}</p>
        </DashCard>
      )}
    </div>
  );
}
