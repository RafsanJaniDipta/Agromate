"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SearchIcon } from "@/components/icons";
import ExpertPublicCard from "@/components/experts/ExpertPublicCard";
import { categoryName, type ExpertCategory, type VerifiedExpert } from "@/lib/expert";

// Every verified expert on the public /experts page, with a search box and a subject filter.
export default function ExpertsDirectory({ experts }: { experts: VerifiedExpert[] }) {
  const t = useTranslations("experts.page");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  // Only subjects some expert actually covers, so no filter leads to an empty list
  const categories = [
    ...new Map(experts.flatMap((expert) => expert.categories).map((category) => [category.id, category])).values(),
  ].sort((a: ExpertCategory, b: ExpertCategory) => categoryName(a, locale).localeCompare(categoryName(b, locale), locale));

  const search = query.trim().toLowerCase();
  const shown = experts.filter((expert) => {
    const inCategory = !categoryId || expert.categories.some((category) => category.id === categoryId);
    const text = [expert.user.name, expert.specialization, expert.organization, expert.user.location]
      .join(" ")
      .toLowerCase();
    return inCategory && text.includes(search);
  });

  const chip = (isActive: boolean) =>
    `rounded-full px-4 py-1.5 text-sm transition ${
      isActive ? "bg-zinc-900 text-white" : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
    }`;

  return (
    <section className="bg-white p-2 text-zinc-900 md:p-3">
      <div className="site-container py-12 md:py-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex w-full items-center gap-2 rounded-full border border-zinc-300 px-4 focus-within:border-brand sm:max-w-sm">
            <SearchIcon className="size-4 shrink-0 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search")}
              aria-label={t("search")}
              className="h-11 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </label>
          <p aria-live="polite" className="px-1 text-sm text-zinc-500">
            {t("count", { count: shown.length })}
          </p>
        </div>

        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setCategoryId(null)} aria-pressed={!categoryId} className={chip(!categoryId)}>
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

        {experts.length === 0 && <p className="mt-10 text-sm text-zinc-500">{t("empty")}</p>}
        {experts.length > 0 && shown.length === 0 && <p className="mt-10 text-sm text-zinc-500">{t("noMatch")}</p>}

        <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((expert) => (
            <li key={expert.id}>
              <ExpertPublicCard expert={expert} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
