"use client";

import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import StoryStatusBadge from "@/components/dashboard/stories/StoryStatusBadge";
import { storyTextFor, type AdminStory, type StoryStatus } from "@/lib/successStories";

export type StoryFilter = StoryStatus | "ALL";
const filters: StoryFilter[] = ["PENDING", "APPROVED", "REJECTED", "ALL"];

type StoryQueueProps = {
  filter: StoryFilter;
  onFilterChange: (filter: StoryFilter) => void;
  stories: AdminStory[] | null;
  loadFailed: boolean;
  selectedId: string | null;
  onSelect: (story: AdminStory) => void;
};

// Status filter pills and the list of stories to pick one for review.
export default function StoryQueue({
  filter,
  onFilterChange,
  stories,
  loadFailed,
  selectedId,
  onSelect,
}: StoryQueueProps) {
  const t = useTranslations("admin.stories");
  const format = useFormatter();
  const locale = useLocale();

  return (
    <DashCard className="flex flex-col gap-4">
      <div role="group" aria-label={t("filterLabel")} className="flex flex-wrap gap-2">
        {filters.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onFilterChange(option)}
            aria-pressed={option === filter}
            className={`rounded-full px-4 py-1.5 text-sm transition ${
              option === filter ? "bg-white text-zinc-900" : "border border-white/15 text-white/70 hover:text-white"
            }`}
          >
            {t(`filters.${option}`)}
          </button>
        ))}
      </div>

      {loadFailed && <p className="text-sm text-red-300">{t("loadError")}</p>}
      {!loadFailed && !stories && <p className="text-sm text-white/60">{t("loading")}</p>}
      {stories?.length === 0 && <p className="text-sm text-white/60">{t("empty")}</p>}

      {stories && stories.length > 0 && (
        <ul className="flex flex-col gap-2">
          {stories.map((story) => {
            const isSelected = story.id === selectedId;
            return (
              <li key={story.id}>
                <button
                  type="button"
                  onClick={() => onSelect(story)}
                  aria-current={isSelected ? "true" : undefined}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    isSelected ? "border-white/25 bg-white/10" : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  <Image
                    src={story.imageUrl}
                    alt=""
                    width={44}
                    height={44}
                    style={{ objectPosition: story.imageFocus }}
                    className="size-11 shrink-0 rounded-full object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{storyTextFor(story, locale).name}</span>
                    <span className="block truncate text-xs text-white/50">
                      {format.dateTime(new Date(story.createdAt), { dateStyle: "medium" })}
                    </span>
                  </span>
                  <StoryStatusBadge status={story.status} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </DashCard>
  );
}
