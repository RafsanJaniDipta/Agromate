"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SearchIcon } from "@/components/icons";
import ExpertCard from "@/components/dashboard/experts/ExpertCard";
import ExpertProfileDialog from "@/components/dashboard/experts/ExpertProfileDialog";
import {
  categoryName,
  getExpertCategories,
  getVerifiedExperts,
  type ExpertCategory,
  type VerifiedExpert,
} from "@/lib/expert";

// Verified experts as cards, with search and (once categories exist) a subject filter.
export default function ExpertDirectory() {
  const t = useTranslations("dashboard.expertsPage");
  const locale = useLocale();
  const [experts, setExperts] = useState<VerifiedExpert[] | null>(null);
  const [categories, setCategories] = useState<ExpertCategory[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [profileOf, setProfileOf] = useState<VerifiedExpert | null>(null);

  const fetchExperts = () =>
    getVerifiedExperts()
      .then(setExperts)
      .catch(() => setLoadFailed(true));

  useEffect(() => {
    void fetchExperts();
    // The filter is optional, so a failed list just hides it
    getExpertCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  function retry() {
    setLoadFailed(false);
    void fetchExperts();
  }

  const search = query.trim().toLowerCase();
  const shown = experts?.filter((expert) => {
    const inCategory = !categoryId || expert.categories.some((category) => category.id === categoryId);
    const text = [expert.user.name, expert.specialization, expert.organization, expert.user.location]
      .join(" ")
      .toLowerCase();
    return inCategory && text.includes(search);
  });

  const chip = (isActive: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm transition ${
      isActive ? "bg-white text-zinc-900" : "border border-white/15 text-white/75 hover:bg-white/10"
    }`;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex w-full items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 backdrop-blur-xl focus-within:border-white/30 sm:max-w-sm">
          <SearchIcon className="size-4 shrink-0 text-white/50" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </label>
        {shown && <p className="px-1 text-sm text-white/55">{t("count", { count: shown.length })}</p>}
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setCategoryId(null)} className={chip(!categoryId)}>
            {t("allCategories")}
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              aria-pressed={categoryId === category.id}
              className={chip(categoryId === category.id)}
            >
              {categoryName(category, locale)}
            </button>
          ))}
        </div>
      )}

      {loadFailed && (
        <p className="text-sm text-red-300">
          {t("loadError")}{" "}
          <button type="button" onClick={retry} className="underline hover:text-red-200">
            {t("retry")}
          </button>
        </p>
      )}
      {!loadFailed && !experts && <p className="text-sm text-white/60">{t("loading")}</p>}
      {experts?.length === 0 && <p className="text-sm text-white/60">{t("empty")}</p>}
      {experts && experts.length > 0 && shown?.length === 0 && <p className="text-sm text-white/60">{t("noMatch")}</p>}

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {shown?.map((expert) => (
          <ExpertCard key={expert.id} expert={expert} onViewProfile={() => setProfileOf(expert)} />
        ))}
      </div>

      {profileOf && <ExpertProfileDialog expert={profileOf} onClose={() => setProfileOf(null)} />}
    </div>
  );
}
