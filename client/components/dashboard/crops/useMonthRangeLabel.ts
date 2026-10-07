import { useTranslations } from "next-intl";
import { monthKey } from "@/lib/months";

// Turns a month range into text such as "October – November", or null when it isn't set.
export function useMonthRangeLabel() {
  const t = useTranslations("months");

  return (start: number | null, end: number | null) => {
    if (start === null || end === null) return null;
    // Ending the month before it starts (Jan – Dec, Mar – Feb) covers all twelve months
    if ((end % 12) + 1 === start) return t("yearRound");
    if (start === end) return t(monthKey(start));
    return t("range", { start: t(monthKey(start)), end: t(monthKey(end)) });
  };
}
