"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { CoinsIcon, PlusIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import Pager from "@/components/dashboard/Pager";
import { darkInput, darkLabel, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import {
  createMarketPrice,
  deleteMarketPrice,
  getCrops,
  getMarketPrices,
  type Crop,
  type MarketPrice,
} from "@/lib/admin";

const PAGE_SIZE = 10;
const UNITS = ["KG", "MAUND", "TON"] as const;
type Unit = (typeof UNITS)[number];
const isKnownUnit = (unit: string): unit is Unit => (UNITS as readonly string[]).includes(unit);

type FormStatus = "idle" | "saving" | "error";

// Admin tool for the daily market price list farmers see: add a price, remove a wrong one.
export default function MarketPriceManager() {
  const t = useTranslations("admin.marketPrices");
  const format = useFormatter();
  const locale = useLocale();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [prices, setPrices] = useState<MarketPrice[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [loadFailed, setLoadFailed] = useState(false);

  // Crop names are stored in both languages; fall back to English when Bangla is missing
  const cropLabel = (crop: Crop) => (locale === "bn" ? (crop.nameBn ?? crop.name) : crop.name);
  // Older rows may hold a unit we have no label for; show those as stored
  const unitLabel = (unit: string) => (isKnownUnit(unit) ? t(`units.${unit}`) : unit);

  const load = useCallback((pageToLoad: number) => {
    getMarketPrices(pageToLoad, PAGE_SIZE)
      .then(({ data, meta }) => {
        setPrices(data);
        setTotal(meta.total);
        setPage(pageToLoad);
      })
      .catch(() => setLoadFailed(true));
  }, []);

  useEffect(() => {
    getCrops().then(setCrops).catch(() => setLoadFailed(true));
    load(1);
  }, [load]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setFormStatus("saving");
    try {
      await createMarketPrice({
        cropId: String(data.get("cropId")),
        district: String(data.get("district")).trim(),
        pricePerUnit: Number(data.get("pricePerUnit")),
        unit: String(data.get("unit")),
      });
      form.reset();
      setFormStatus("idle");
      load(1);
    } catch {
      setFormStatus("error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMarketPrice(id);
      load(page);
    } catch {
      setLoadFailed(true);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <DashCard>
        <CardHeader icon={<PlusIcon />} title={t("addTitle")} />
        <form onSubmit={handleAdd} className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5 xl:items-end">
          <div className="flex flex-col gap-2">
            <label htmlFor="price-crop" className={darkLabel}>{t("fields.crop")}</label>
            <select id="price-crop" name="cropId" required className={darkInput}>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id} className="bg-zinc-900">
                  {cropLabel(crop)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="price-district" className={darkLabel}>{t("fields.district")}</label>
            <input id="price-district" name="district" required placeholder={t("districtPlaceholder")} className={darkInput} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="price-amount" className={darkLabel}>{t("fields.price")}</label>
            <input id="price-amount" name="pricePerUnit" type="number" min={0} step="0.01" required className={darkInput} />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="price-unit" className={darkLabel}>{t("fields.unit")}</label>
            <select id="price-unit" name="unit" className={darkInput}>
              {UNITS.map((unit) => (
                <option key={unit} value={unit} className="bg-zinc-900">
                  {unitLabel(unit)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={formStatus === "saving"} className={primaryButton}>
            {formStatus === "saving" ? t("adding") : t("add")}
          </button>
        </form>
        <p aria-live="polite" className="mt-2 text-sm text-red-300">
          {formStatus === "error" && t("addError")}
        </p>
      </DashCard>

      <DashCard>
        <CardHeader icon={<CoinsIcon />} title={t("listTitle")} />
        {loadFailed && <p className="mt-4 text-sm text-red-300">{t("loadError")}</p>}
        {prices?.length === 0 && <p className="mt-4 text-sm text-white/60">{t("empty")}</p>}

        {prices && prices.length > 0 && (
          <ul className="mt-4 divide-y divide-white/10">
            {prices.map((price) => (
              <li key={price.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{cropLabel(price.crop)}</p>
                  <p className="text-xs text-white/60">
                    {price.district} · {format.dateTime(new Date(price.date), { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">
                    {format.number(price.pricePerUnit, { style: "currency", currency: "BDT" })}
                    <span className="text-white/60"> / {unitLabel(price.unit)}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDelete(price.id)}
                    className={`${secondaryButton} px-3 py-1.5 text-xs`}
                  >
                    {t("delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {prices && <Pager page={page} limit={PAGE_SIZE} total={total} onChange={load} />}
      </DashCard>
    </div>
  );
}
