"use client";

import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { storyTextFor, type MyStory, type StoryStatus } from "@/lib/successStories";

// A small coloured dot before the review status, instead of a full badge
const statusDot: Record<StoryStatus, string> = {
  PENDING: "bg-amber-400",
  APPROVED: "bg-emerald-400",
  REJECTED: "bg-red-400",
};

type StoryCardProps = {
  story: MyStory;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

// One of the farmer's own stories as a quiet row: photo, name, review status, the quote,
// the three results in one line, and edit / delete as text links.
export default function StoryCard({ story, isDeleting, onEdit, onDelete }: StoryCardProps) {
  const t = useTranslations("dashboard.storiesPage");
  const format = useFormatter();
  const locale = useLocale();
  const { name, role, location, quote } = storyTextFor(story, locale);

  const percent = (value: number) => format.number(value / 100, { style: "percent", signDisplay: "exceptZero" });
  const results = [
    `${t("results.yield")} ${percent(story.yieldChangePercent)}`,
    `${t("results.cost")} ${percent(story.costChangePercent)}`,
    `${t("results.income")} ${percent(story.incomeChangePercent)}`,
  ].join(" · ");

  return (
    <article className="flex gap-4 py-4">
      <Image src={story.imageUrl} alt="" width={48} height={48} className="size-12 shrink-0 rounded-full object-cover" />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="min-w-0 truncate text-sm">
            <span className="font-medium">{name}</span>
            <span className="text-white/50">
              {" "}
              · {role}, {location}
            </span>
          </p>
          <span className="flex shrink-0 items-center gap-1.5 text-xs text-white/70">
            <span aria-hidden className={`size-2 rounded-full ${statusDot[story.status]}`} />
            {t(`status.${story.status}`)}
            {story.status === "APPROVED" && story.isFeatured && ` · ${t("featured")}`}
          </span>
        </div>

        <blockquote className="line-clamp-2 text-sm leading-relaxed text-white/75">“{quote}”</blockquote>
        <p className="text-xs text-white/50">{results}</p>

        {story.status === "REJECTED" && story.rejectionReason && (
          <p className="text-xs text-red-200">{t("rejectedReason", { reason: story.rejectionReason })}</p>
        )}

        <div className="flex items-center gap-4 text-xs">
          <span className="text-white/40">
            {t("sentOn", { date: format.dateTime(new Date(story.createdAt), { dateStyle: "medium" }) })}
          </span>
          <button type="button" onClick={onEdit} disabled={isDeleting} className="text-white/60 hover:text-white">
            {t("edit")}
          </button>
          <button type="button" onClick={onDelete} disabled={isDeleting} className="text-red-300/80 hover:text-red-300">
            {isDeleting ? t("deleting") : t("delete")}
          </button>
        </div>
      </div>
    </article>
  );
}
