import { useFormatter, useTranslations } from "next-intl";
import type { StoryResults } from "@/lib/successStories";

// Yield, cost and income change of a story, e.g. "+30%" / "-20%".
export default function StoryResultsList({ results }: { results: StoryResults }) {
  const t = useTranslations("dashboard.storiesPage.results");
  const format = useFormatter();

  const items = [
    { label: t("yield"), value: results.yieldChangePercent },
    { label: t("cost"), value: results.costChangePercent },
    { label: t("income"), value: results.incomeChangePercent },
  ];

  return (
    <dl className="grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
      {items.map(({ label, value }) => (
        <div key={label}>
          <dt className="text-xs text-white/50">{label}</dt>
          <dd className="mt-0.5 font-semibold">
            {format.number(value / 100, { style: "percent", signDisplay: "exceptZero" })}
          </dd>
        </div>
      ))}
    </dl>
  );
}
