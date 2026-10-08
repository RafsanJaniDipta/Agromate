"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import { ChevronDownIcon } from "@/components/icons";
import { cropName } from "@/lib/crops";
import { deleteDiagnosis, getDiagnosisHistory, type SavedDiagnosis } from "@/lib/diseases";

const PAGE_SIZE = 10;

// Square thumbnail straight from Cloudinary, so the list doesn't load full photos
const thumbnailUrl = (url: string) => url.replace("/upload/", "/upload/c_fill,w_96,h_96,q_auto,f_auto/");

type DiagnosisHistoryProps = {
  // Goes up after each new check is saved, so the list reloads with it on top
  version: number;
};

// The farmer's earlier AI checks, newest first, as a quiet list: photo, finding and date.
// Tapping a row opens the signs, advice and photo; delete lives inside the opened row.
export default function DiagnosisHistory({ version }: DiagnosisHistoryProps) {
  const t = useTranslations("dashboard.diagnosePage.history");
  const tCheck = useTranslations("dashboard.diagnose");
  const format = useFormatter();
  const locale = useLocale();
  const [items, setItems] = useState<SavedDiagnosis[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadFailed, setLoadFailed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteFailed, setDeleteFailed] = useState(false);

  // First page, again whenever a new check is saved
  useEffect(() => {
    let isCurrent = true;
    getDiagnosisHistory(1, PAGE_SIZE)
      .then(({ items: loaded, meta }) => {
        if (!isCurrent) return;
        setItems(loaded);
        setTotal(meta.total);
        setPage(1);
      })
      .catch(() => isCurrent && setLoadFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [version]);

  async function loadMore() {
    try {
      const { items: more, meta } = await getDiagnosisHistory(page + 1, PAGE_SIZE);
      setItems((current) => [...(current ?? []), ...more]);
      setTotal(meta.total);
      setPage(page + 1);
    } catch {
      setLoadFailed(true);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await deleteDiagnosis(id);
      setItems((current) => current?.filter((item) => item.id !== id) ?? null);
      setTotal((count) => count - 1);
      setDeleteFailed(false);
    } catch {
      setDeleteFailed(true);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="px-1 text-lg font-semibold">{t("title")}</h2>

      {loadFailed && <p className="px-1 text-sm text-red-300">{t("loadError")}</p>}
      {!loadFailed && !items && <p className="px-1 text-sm text-white/50">{t("loading")}</p>}
      {items?.length === 0 && <p className="px-1 text-sm text-white/50">{t("empty")}</p>}
      {deleteFailed && <p className="px-1 text-sm text-red-300">{t("deleteError")}</p>}

      {items && items.length > 0 && (
        <DashCard className="p-2">
          <ul className="divide-y divide-white/10">
            {items.map((item) => {
              const isOpen = openId === item.id;
              const linkedCrop = item.cropCycle
                ? t("linkedTo", { crop: cropName(item.cropCycle.crop, locale), field: item.cropCycle.field.name })
                : null;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-white/5"
                  >
                    <Image
                      src={thumbnailUrl(item.imageUrl)}
                      alt=""
                      width={48}
                      height={48}
                      unoptimized
                      className="size-12 shrink-0 rounded-xl object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`size-2 shrink-0 rounded-full ${item.isHealthy ? "bg-emerald-400" : "bg-amber-400"}`}
                        />
                        <span className="truncate text-sm font-medium">
                          {item.isHealthy ? tCheck("healthy") : item.disease}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-white/50">
                        {[item.cropName, linkedCrop].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-white/45">
                      {format.dateTime(new Date(item.createdAt), { day: "numeric", month: "short" })}
                    </span>
                    <ChevronDownIcon className={`size-4 shrink-0 text-white/40 transition ${isOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isOpen && (
                    <div className="flex flex-col gap-3 px-2 pb-4 pl-17 text-sm">
                      <p className="text-xs text-white/45">
                        {format.dateTime(new Date(item.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                        {" · "}
                        {tCheck("confidenceLabel")}: {tCheck(`confidenceLevels.${item.confidence}`)}
                      </p>
                      {item.symptoms && <p className="text-white/80">{item.symptoms}</p>}
                      {item.advice.length > 0 && (
                        <ul className="flex flex-col gap-1.5">
                          {item.advice.map((step) => (
                            <li key={step} className="flex gap-2.5 text-white/80">
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                              {step}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-4 text-xs">
                        <a href={item.imageUrl} target="_blank" rel="noreferrer" className="text-white/60 hover:text-white">
                          {t("openPhoto")}
                        </a>
                        <button type="button" onClick={() => remove(item.id)} className="text-red-300/80 hover:text-red-300">
                          {t("delete")}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </DashCard>
      )}

      {items && items.length < total && (
        <button type="button" onClick={loadMore} className="self-center text-sm text-white/60 hover:text-white">
          {t("loadMore", { count: total - items.length })}
        </button>
      )}
    </section>
  );
}
