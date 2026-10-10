"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import StoryQueue, { type StoryFilter } from "@/components/admin/stories/StoryQueue";
import StoryReviewPanel, { type ReviewNotice } from "@/components/admin/stories/StoryReviewPanel";
import { getAdminStories, type AdminStory } from "@/lib/successStories";

// Admin page body: the story list on the left, the selected story's review panel on the right.
export default function StoryModeration() {
  const t = useTranslations("admin.stories");
  const panelTop = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<StoryFilter>("PENDING");
  const [stories, setStories] = useState<AdminStory[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [selected, setSelected] = useState<AdminStory | null>(null);
  const [notice, setNotice] = useState<ReviewNotice | null>(null);

  useEffect(() => {
    // Ignores an older request that finishes after the filter has changed again
    let isCurrent = true;
    getAdminStories(filter === "ALL" ? undefined : filter)
      .then((loaded) => isCurrent && setStories(loaded))
      .catch(() => isCurrent && setLoadFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [filter]);

  function changeFilter(next: StoryFilter) {
    setFilter(next);
    setStories(null);
    setLoadFailed(false);
    setSelected(null);
  }

  function select(story: AdminStory) {
    setSelected(story);
    setNotice(null);
    // On narrow screens the panel sits below the list
    panelTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleReviewed(saved: AdminStory, result: ReviewNotice) {
    // A story that no longer matches the filter leaves the list
    const stillListed = filter === "ALL" || saved.status === filter;
    setStories((current) =>
      stillListed
        ? (current ?? []).map((story) => (story.id === saved.id ? saved : story))
        : (current ?? []).filter((story) => story.id !== saved.id),
    );
    setSelected(stillListed ? saved : null);
    setNotice(result);
  }

  function handleDeleted(id: string) {
    setStories((current) => current?.filter((story) => story.id !== id) ?? null);
    setSelected(null);
    setNotice("deleted");
  }

  return (
    <div className="grid items-start gap-5 xl:grid-cols-[22rem_1fr]">
      <StoryQueue
        filter={filter}
        onFilterChange={changeFilter}
        stories={stories}
        loadFailed={loadFailed}
        selectedId={selected?.id ?? null}
        onSelect={select}
      />

      <div ref={panelTop} className="flex min-w-0 scroll-mt-28 flex-col gap-3">
        {notice && (
          <p role="status" className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
            {t(`notices.${notice}`)}
          </p>
        )}

        {selected ? (
          // key remounts the form so its fields show the freshly saved values
          <StoryReviewPanel
            key={`${selected.id}-${selected.updatedAt}`}
            story={selected}
            onReviewed={handleReviewed}
            onDeleted={handleDeleted}
          />
        ) : (
          <DashCard>
            <p className="text-sm text-white/60">{t("pickHint")}</p>
          </DashCard>
        )}
      </div>
    </div>
  );
}
