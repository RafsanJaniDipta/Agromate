import { useLocale, useTranslations } from "next-intl";
import { WheatIcon } from "@/components/icons";
import { useMonthRangeLabel } from "@/components/dashboard/crops/useMonthRangeLabel";
import { cropDescription, cropName, type Crop } from "@/lib/crops";

// One crop in the farmer's crop guide: name, short description and growing needs.
export default function CropCard({ crop }: { crop: Crop }) {
  const t = useTranslations("dashboard.cropsPage");
  const locale = useLocale();
  const monthRangeLabel = useMonthRangeLabel();
  const description = cropDescription(crop, locale);

  // Soil and type are shown as stored; only filled-in rows are listed
  const details = [
    { key: "sowing", value: monthRangeLabel(crop.sowingStartMonth, crop.sowingEndMonth) },
    { key: "soil", value: crop.idealSoil },
    { key: "temp", value: crop.optimalTemp !== null ? t("tempValue", { value: crop.optimalTemp }) : null },
    {
      key: "rainfall",
      value: crop.optimalRainfall !== null ? t("rainfallValue", { value: crop.optimalRainfall }) : null,
    },
    {
      key: "duration",
      value: crop.durationDays !== null ? t("durationValue", { days: crop.durationDays }) : null,
    },
  ] as const;

  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5">
      <header className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/20 text-brand">
          <WheatIcon className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{cropName(crop, locale)}</h3>
          {crop.category && (
            <p className="text-xs text-white/60">
              {t("details.category")}: {crop.category}
            </p>
          )}
        </div>
      </header>

      {description && <p className="text-sm text-white/75">{description}</p>}

      <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-white/10 pt-4 text-sm">
        {details
          .filter((detail) => detail.value)
          .map((detail) => (
            <div key={detail.key} className="min-w-0">
              <dt className="text-xs text-white/50">{t(`details.${detail.key}`)}</dt>
              <dd className="truncate font-medium">{detail.value}</dd>
            </div>
          ))}
      </dl>
    </article>
  );
}
