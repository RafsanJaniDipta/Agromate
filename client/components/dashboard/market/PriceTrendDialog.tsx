"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { CloseIcon } from "@/components/icons";
import { getPriceHistory, itemName, itemUnit, type PriceItem, type PricePoint } from "@/lib/prices";

const WIDTH = 560;
const HEIGHT = 220;
const PADDING = { top: 16, right: 12, bottom: 28, left: 44 };

type PriceTrendDialogProps = { item: PriceItem; onClose: () => void };

// The last 30 days of an item's price: the band between the day's lowest and highest
// price, with the midpoint as a line. A native <dialog> sits above the blurred cards.
export default function PriceTrendDialog({ item, onClose }: PriceTrendDialogProps) {
  const t = useTranslations("prices.trend");
  const tMarket = useTranslations("market");
  const format = useFormatter();
  const locale = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const [points, setPoints] = useState<PricePoint[] | null>(null);

  useEffect(() => {
    dialog.current?.showModal();
    getPriceHistory(item.id)
      .then(setPoints)
      .catch(() => setPoints([]));
  }, [item.id]);

  const shortDate = (date: string) =>
    format.dateTime(new Date(date), { day: "numeric", month: "short", timeZone: "UTC" });

  let chart = null;
  if (points && points.length >= 2) {
    const low = Math.min(...points.map((point) => point.minPrice));
    const high = Math.max(...points.map((point) => point.maxPrice));
    // A little room above and below so a flat price isn't drawn on the edge
    const span = Math.max(high - low, high * 0.1);
    const bottom = Math.max(0, low - span * 0.15);
    const top = high + span * 0.15;
    const x = (index: number) =>
      PADDING.left + (index / (points.length - 1)) * (WIDTH - PADDING.left - PADDING.right);
    const y = (price: number) =>
      PADDING.top + (1 - (price - bottom) / (top - bottom)) * (HEIGHT - PADDING.top - PADDING.bottom);

    const band = [
      ...points.map((point, index) => `${x(index)},${y(point.maxPrice)}`),
      ...[...points].reverse().map((point, index) => `${x(points.length - 1 - index)},${y(point.minPrice)}`),
    ].join(" ");
    const midline = points.map((point, index) => `${x(index)},${y((point.minPrice + point.maxPrice) / 2)}`).join(" ");
    const ticks = [bottom, (bottom + top) / 2, top];

    chart = (
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="mt-4 w-full" role="img" aria-label={t("title", { item: itemName(item, locale) })}>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PADDING.left} x2={WIDTH - PADDING.right} y1={y(tick)} y2={y(tick)} className="stroke-white/10" />
            <text x={PADDING.left - 6} y={y(tick) + 4} textAnchor="end" className="fill-white/50 text-[11px]">
              {format.number(Math.round(tick))}
            </text>
          </g>
        ))}
        <polygon points={band} className="fill-lime-400/20" />
        <polyline points={midline} fill="none" className="stroke-lime-400" strokeWidth={2} strokeLinejoin="round" />
        <text x={PADDING.left} y={HEIGHT - 8} className="fill-white/50 text-[11px]">
          {shortDate(points[0]!.date)}
        </text>
        <text x={WIDTH - PADDING.right} y={HEIGHT - 8} textAnchor="end" className="fill-white/50 text-[11px]">
          {shortDate(points.at(-1)!.date)}
        </text>
      </svg>
    );
  }

  const range = points && points.length > 0
    ? {
        low: Math.min(...points.map((point) => point.minPrice)),
        high: Math.max(...points.map((point) => point.maxPrice)),
      }
    : null;

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      className="m-auto w-[min(40rem,calc(100vw-2rem))] rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t("title", { item: itemName(item, locale) })}</h2>
          <p className="mt-0.5 text-xs text-white/50">/{itemUnit(item, locale)}</p>
        </div>
        <button
          type="button"
          onClick={() => dialog.current?.close()}
          aria-label={t("close")}
          className="grid size-9 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      {points === null && <div className="mt-4 h-40 animate-pulse rounded-2xl bg-white/5" />}
      {points && points.length < 2 && <p className="mt-6 text-sm text-white/60">{t("empty")}</p>}
      {chart}

      {range && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-white/5 p-3">
            <dt className="text-xs text-white/50">{t("low")}</dt>
            <dd className="mt-0.5 font-semibold">{tMarket("price", { price: range.low })}</dd>
          </div>
          <div className="rounded-2xl bg-white/5 p-3">
            <dt className="text-xs text-white/50">{t("high")}</dt>
            <dd className="mt-0.5 font-semibold">{tMarket("price", { price: range.high })}</dd>
          </div>
        </dl>
      )}
    </dialog>
  );
}
