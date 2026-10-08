import { useTranslations } from "next-intl";
import type { CropCycleStatus } from "@/lib/cropCycles";

const statusStyles: Record<CropCycleStatus, string> = {
  PLANNED: "border-sky-300/30 bg-sky-300/10 text-sky-200",
  PLANTED: "border-lime-300/30 bg-lime-300/10 text-lime-200",
  GROWING: "border-emerald-300/30 bg-emerald-300/10 text-emerald-200",
  HARVESTED: "border-amber-300/30 bg-amber-300/10 text-amber-200",
  FAILED: "border-red-300/30 bg-red-300/10 text-red-200",
};

// Coloured pill with where a planted crop is in its life.
export default function CropCycleStatusBadge({ status }: { status: CropCycleStatus }) {
  const t = useTranslations("dashboard.myCropsPage.statuses");

  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs ${statusStyles[status]}`}>
      {t(status)}
    </span>
  );
}
