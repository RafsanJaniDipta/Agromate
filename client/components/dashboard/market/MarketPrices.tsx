"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPinIcon, SearchIcon } from "@/components/icons";
import Pager from "@/components/dashboard/Pager";
import PriceTable from "@/components/dashboard/market/PriceTable";
import PriceTrendDialog from "@/components/dashboard/market/PriceTrendDialog";
import ReportPriceDialog from "@/components/dashboard/market/ReportPriceDialog";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { ACTIVE_STATUSES, getCropCycles } from "@/lib/cropCycles";
import { getPrices, PRICE_CATEGORIES, type PriceCategory, type PriceItem, type PriceList } from "@/lib/prices";
import { getDistricts, type District } from "@/lib/weather";

// Rows per page of the price table
const PAGE_SIZE = 10;

// The district the farmer last picked, per user, so it stays picked on the next visit.
// Storage can be blocked (private mode); then the farmer's own district is used.
const districtKey = (userId: string) => `agromate:price-district:${userId}`;

function readSavedDistrict(userId: string) {
  try {
    return localStorage.getItem(districtKey(userId)) || null;
  } catch {
    return null;
  }
}

function saveDistrict(userId: string, district: string | null) {
  try {
    if (district) localStorage.setItem(districtKey(userId), district);
    else localStorage.removeItem(districtKey(userId));
  } catch {
    // only a convenience
  }
}

// The farmer's market page: one tab per kind of item, crops the farmer grows first, and
// farmer-reported prices for any district (their own by default).
export default function MarketPrices() {
  const t = useTranslations("prices");
  const locale = useLocale();
  const me = useCurrentUser();
  const [category, setCategory] = useState<PriceCategory>("CROP");
  // English district name, or null for the farmer's own district
  const [district, setDistrict] = useState<string | null>(() => readSavedDistrict(me.id));
  const [districts, setDistricts] = useState<District[]>([]);
  // Loaded lists per tab and district, so switching back is instant
  const [lists, setLists] = useState<Record<string, PriceList>>({});
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [myCropIds, setMyCropIds] = useState<Set<string>>(new Set());
  const [reporting, setReporting] = useState<PriceItem | null>(null);
  const [trendOf, setTrendOf] = useState<PriceItem | null>(null);

  const listKey = (which: PriceCategory, place: string | null) => `${which}|${place ?? ""}`;

  const load = useCallback((which: PriceCategory, place: string | null) => {
    getPrices(which, place)
      .then((list) => {
        setLists((current) => ({ ...current, [`${which}|${place ?? ""}`]: list }));
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => load(category, district), [category, district, load]);

  useEffect(() => {
    // Both only refine the page, so a failure just leaves them out
    getDistricts()
      .then(setDistricts)
      .catch(() => {});
    getCropCycles()
      .then((cycles) =>
        setMyCropIds(new Set(cycles.filter((cycle) => ACTIVE_STATUSES.includes(cycle.status)).map((cycle) => cycle.cropId))),
      )
      .catch(() => {});
  }, []);

  // A new tab, district or search starts again on the first page
  function chooseCategory(which: PriceCategory) {
    setCategory(which);
    setPage(1);
  }

  function search(text: string) {
    setQuery(text);
    setPage(1);
  }

  function chooseDistrict(value: string) {
    const chosen = value || null;
    setDistrict(chosen);
    setPage(1);
    saveDistrict(me.id, chosen);
  }

  const list = lists[listKey(category, district)];
  const homeDistrict = list?.homeDistrict ?? null;
  const isMine = (item: PriceItem) => item.cropId !== null && myCropIds.has(item.cropId);
  const searchText = query.trim().toLowerCase();
  const shown = list?.items
    .filter((item) => `${item.nameBn} ${item.nameEn} ${item.details ?? ""}`.toLowerCase().includes(searchText))
    .sort((a, b) => Number(isMine(b)) - Number(isMine(a)));
  // Stays in range when a reload shortens the list
  const currentPage = Math.min(page, Math.max(1, Math.ceil((shown?.length ?? 0) / PAGE_SIZE)));
  const pageItems = shown?.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const districtName = (place: District | { en: string; bn: string }) =>
    "nameEn" in place ? (locale === "bn" ? place.nameBn : place.nameEn) : locale === "bn" ? place.bn : place.en;
  const sortedDistricts = [...districts].sort((a, b) => districtName(a).localeCompare(districtName(b), locale));

  const chip = (isActive: boolean) =>
    `rounded-full px-4 py-2 text-sm transition ${
      isActive ? "bg-white text-zinc-900" : "border border-white/15 bg-black/30 text-white/80 backdrop-blur-xl hover:bg-white/10"
    }`;
  const field = "flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 backdrop-blur-xl focus-within:border-white/30";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2" role="tablist">
        {PRICE_CATEGORIES.map((which) => (
          <button
            key={which}
            type="button"
            role="tab"
            aria-selected={category === which}
            onClick={() => chooseCategory(which)}
            className={chip(category === which)}
          >
            {t(`tabs.${which}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className={`${field} sm:w-72`}>
          <MapPinIcon className="size-4 shrink-0 text-white/50" />
          <span className="sr-only">{t("district.label")}</span>
          <select
            value={district ?? ""}
            onChange={(event) => chooseDistrict(event.target.value)}
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none"
          >
            <option value="" className="bg-zinc-900">
              {homeDistrict ? t("district.mine", { district: districtName(homeDistrict) }) : t("district.choose")}
            </option>
            {sortedDistricts.map((place) => (
              <option key={place.nameEn} value={place.nameEn} className="bg-zinc-900">
                {districtName(place)}
              </option>
            ))}
          </select>
        </label>
        <label className={`${field} flex-1 sm:max-w-sm`}>
          <SearchIcon className="size-4 shrink-0 text-white/50" />
          <input
            type="search"
            value={query}
            onChange={(event) => search(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </label>
      </div>

      {failed && !list && (
        <p className="text-sm text-red-300">
          {t("loadError")}{" "}
          <button type="button" onClick={() => load(category, district)} className="underline hover:text-red-200">
            {t("retry")}
          </button>
        </p>
      )}
      {!failed && !list && <p className="text-sm text-white/60">{t("loading")}</p>}
      {list?.items.length === 0 && <p className="text-sm text-white/60">{t(`empty.${category}`)}</p>}
      {list && list.items.length > 0 && shown?.length === 0 && <p className="text-sm text-white/60">{t("noMatch")}</p>}

      {shown && pageItems && shown.length > 0 && (
        <div>
          <PriceTable items={pageItems} isMyCrop={isMine} onReport={setReporting} onShowTrend={setTrendOf} />
          {shown.length > PAGE_SIZE && (
            <Pager page={currentPage} limit={PAGE_SIZE} total={shown.length} onChange={setPage} />
          )}
        </div>
      )}

      {reporting && (
        <ReportPriceDialog
          item={reporting}
          homeDistrict={homeDistrict}
          onClose={() => setReporting(null)}
          onReported={() => load(reporting.category, district)}
        />
      )}
      {trendOf && <PriceTrendDialog item={trendOf} onClose={() => setTrendOf(null)} />}
    </div>
  );
}
