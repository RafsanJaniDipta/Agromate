"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { darkInput, darkLabel, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { ApiError } from "@/lib/api";
import { itemName, itemUnit, reportPrice, type DistrictLabel, type PriceItem } from "@/lib/prices";

// Fertilizer is usually bought by the 50 kg bag; the price is turned into per-kg before sending
const BAG_KG = 50;

type ReportPriceDialogProps = {
  item: PriceItem;
  // The farmer's own district: reports count there, whichever district the page shows
  homeDistrict: DistrictLabel | null;
  onClose: () => void;
  onReported: () => void;
};

type Status = "idle" | "sending" | "done" | "error" | "invalid";

// Asks what the farmer paid (fertilizer, pesticide) or got (crops) today for one item.
export default function ReportPriceDialog({ item, homeDistrict, onClose, onReported }: ReportPriceDialogProps) {
  const t = useTranslations("prices.report");
  const locale = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [perBag, setPerBag] = useState(item.category === "FERTILIZER");
  const unit = itemUnit(item, locale);
  const canUseBags = item.category === "FERTILIZER" && item.unitEn === "kg";
  const district = homeDistrict && (locale === "bn" ? homeDistrict.bn : homeDistrict.en);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const entered = Number(new FormData(event.currentTarget).get("price"));
    const price = canUseBags && perBag ? entered / BAG_KG : entered;

    setStatus("sending");
    try {
      await reportPrice(item.id, Math.round(price * 100) / 100);
      setStatus("done");
      onReported();
    } catch (error) {
      setStatus(error instanceof ApiError && error.status === 422 ? "invalid" : "error");
    }
  }

  const title = item.category === "CROP" ? t("titleSell", { item: itemName(item, locale) }) : t("titleBuy", { item: itemName(item, locale) });

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      aria-labelledby="report-price-title"
      className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <h2 id="report-price-title" className="text-lg font-semibold">
        {title}
      </h2>

      {status === "done" ? (
        <>
          <p className="mt-4 text-sm text-green-300">{t("thanks")}</p>
          <button type="button" onClick={() => dialog.current?.close()} className={`${primaryButton} mt-6`}>
            {t("close")}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {canUseBags && (
            <div className="flex gap-2" role="radiogroup">
              {[true, false].map((bag) => (
                <button
                  key={String(bag)}
                  type="button"
                  role="radio"
                  aria-checked={perBag === bag}
                  onClick={() => setPerBag(bag)}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition ${
                    perBag === bag ? "bg-white text-zinc-900" : "border border-white/15 text-white/75 hover:bg-white/10"
                  }`}
                >
                  {bag ? t("perBag") : t("perUnit", { unit })}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="report-price" className={darkLabel}>
              {t("price")} · {canUseBags && perBag ? t("perBag") : t("perUnit", { unit })}
            </label>
            <input
              id="report-price"
              name="price"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              required
              autoFocus
              className={darkInput}
            />
          </div>

          <p className="text-xs text-white/50">
            {district ? t("districtNote", { district }) : t("noDistrict")}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={status === "sending"} className={primaryButton}>
              {status === "sending" ? t("sending") : t("submit")}
            </button>
            <button type="button" onClick={() => dialog.current?.close()} className={secondaryButton}>
              {t("cancel")}
            </button>
          </div>
          <p aria-live="polite" className="text-sm text-red-300">
            {status === "error" && t("error")}
            {status === "invalid" && t("invalid")}
          </p>
        </form>
      )}
    </dialog>
  );
}
