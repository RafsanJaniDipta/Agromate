"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SearchIcon, WheatIcon } from "@/components/icons";
import CropForm from "@/components/admin/crops/CropForm";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import { useMonthRangeLabel } from "@/components/dashboard/crops/useMonthRangeLabel";
import { darkInput, secondaryButton } from "@/components/dashboard/formStyles";
import { ApiError } from "@/lib/api";
import { cropName, deleteCrop, getCrops, type Crop } from "@/lib/crops";

type Notice = "created" | "updated" | "deleted" | "inUse" | "deleteError";
const errorNotices: Notice[] = ["inUse", "deleteError"];

// Admin page body: the add/edit form on the left, the crop catalog on the right.
export default function CropManager() {
  const t = useTranslations("admin.crops");
  const locale = useLocale();
  const monthRangeLabel = useMonthRangeLabel();
  const formTop = useRef<HTMLDivElement>(null);
  const [crops, setCrops] = useState<Crop[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Crop | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  // Bumped after a crop is added, so the form remounts empty
  const [formRound, setFormRound] = useState(0);

  useEffect(() => {
    getCrops()
      .then(setCrops)
      .catch(() => setLoadFailed(true));
  }, []);

  // The whole catalog is small, so the admin search filters it in the browser
  const query = search.trim().toLowerCase();
  const visibleCrops = crops?.filter((crop) =>
    [crop.name, crop.nameBn].some((name) => name?.toLowerCase().includes(query)),
  );

  function startEditing(crop: Crop) {
    setEditing(crop);
    setNotice(null);
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSaved(saved: Crop) {
    // Keeps the list in the server's A–Z order
    setCrops((current) =>
      [...(current ?? []).filter((crop) => crop.id !== saved.id), saved].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setNotice(editing ? "updated" : "created");
    setEditing(null);
    setFormRound((round) => round + 1);
  }

  async function handleDelete(crop: Crop) {
    if (!window.confirm(t("confirmDelete"))) return;

    setDeletingId(crop.id);
    try {
      await deleteCrop(crop.id);
      setCrops((current) => current?.filter(({ id }) => id !== crop.id) ?? null);
      if (editing?.id === crop.id) setEditing(null);
      setNotice("deleted");
    } catch (error) {
      // 409: market prices, crop cycles or questions still use this crop
      setNotice(error instanceof ApiError && error.status === 409 ? "inUse" : "deleteError");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[1fr_26rem]">
      <div ref={formTop} className="flex scroll-mt-28 flex-col gap-3">
        {notice && (
          <p
            role="status"
            className={`rounded-2xl border px-4 py-3 text-sm ${
              errorNotices.includes(notice)
                ? "border-red-300/30 bg-red-300/10 text-red-100"
                : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
            }`}
          >
            {t(`notices.${notice}`)}
          </p>
        )}
        {/* key gives each new or edited crop a fresh form */}
        <CropForm
          key={editing?.id ?? `new-${formRound}`}
          editing={editing}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      </div>

      <DashCard className="flex flex-col gap-4">
        <CardHeader icon={<WheatIcon />} title={t("listTitle")} />
        <p className="text-sm text-white/60">{t("intro")}</p>

        <label className="relative block">
          <span className="sr-only">{t("searchLabel")}</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/50" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className={`${darkInput} pl-10`}
          />
        </label>

        {loadFailed && <p className="text-sm text-red-300">{t("loadError")}</p>}
        {!loadFailed && !crops && <p className="text-sm text-white/60">{t("loading")}</p>}
        {visibleCrops?.length === 0 && <p className="text-sm text-white/60">{t("empty")}</p>}

        {visibleCrops && visibleCrops.length > 0 && (
          <ul className="divide-y divide-white/10">
            {visibleCrops.map((crop) => {
              const isDeleting = deletingId === crop.id;
              return (
                <li
                  key={crop.id}
                  aria-current={editing?.id === crop.id ? "true" : undefined}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{cropName(crop, locale)}</p>
                    <p className="truncate text-xs text-white/60">
                      {[crop.category, monthRangeLabel(crop.sowingStartMonth, crop.sowingEndMonth), crop.durationDays && t("daysShort", { days: crop.durationDays })]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(crop)}
                      className={`${secondaryButton} px-3 py-1.5 text-xs`}
                    >
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(crop)}
                      disabled={isDeleting}
                      className={`${secondaryButton} px-3 py-1.5 text-xs`}
                    >
                      {isDeleting ? t("deleting") : t("delete")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </DashCard>
    </div>
  );
}
