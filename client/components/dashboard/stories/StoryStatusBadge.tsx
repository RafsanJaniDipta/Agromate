import { useTranslations } from "next-intl";
import type { StoryStatus } from "@/lib/successStories";

const statusStyles: Record<StoryStatus, string> = {
  PENDING: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  APPROVED: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  REJECTED: "border-red-300/30 bg-red-300/10 text-red-200",
};

// Coloured pill with a story's review status; shared by the farmer and admin pages.
export default function StoryStatusBadge({ status }: { status: StoryStatus }) {
  const t = useTranslations("dashboard.storiesPage.status");

  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${statusStyles[status]}`}>
      {t(status)}
    </span>
  );
}
