"use client";

import { useTranslations } from "next-intl";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";

type PagerProps = {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
};

const button =
  "flex size-9 items-center justify-center rounded-full border border-white/10 transition hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent";

// Previous / next buttons with "page X of Y" for paginated dashboard lists.
export default function Pager({ page, limit, total, onChange }: PagerProps) {
  const t = useTranslations("dashboard.pager");
  const pageCount = Math.max(1, Math.ceil(total / limit));

  return (
    <nav aria-label={t("label")} className="mt-4 flex items-center justify-end gap-3 text-sm text-white/70">
      <button type="button" aria-label={t("previous")} disabled={page <= 1} onClick={() => onChange(page - 1)} className={button}>
        <ArrowLeftIcon className="size-4" />
      </button>
      <span>{t("position", { page, pageCount })}</span>
      <button
        type="button"
        aria-label={t("next")}
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        className={button}
      >
        <ArrowRightIcon className="size-4" />
      </button>
    </nav>
  );
}
