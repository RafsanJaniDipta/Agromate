import { useTranslations } from "next-intl";
import { MapPinIcon } from "@/components/icons";
import { useFarmLabels } from "@/components/dashboard/farms/useFarmLabels";
import { secondaryButton } from "@/components/dashboard/formStyles";
import type { Field } from "@/lib/farms";

type FieldRowProps = {
  field: Field;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  // Opens the satellite map to draw or change the outline
  onDrawBoundary: () => void;
};

const smallButton = `${secondaryButton} px-3 py-1.5 text-xs`;

// One field in a farm card: name, area, soil and whether it's on the map, with its buttons.
export default function FieldRow({ field, isDeleting, onEdit, onDelete, onDrawBoundary }: FieldRowProps) {
  const t = useTranslations("dashboard.farmsPage");
  const { areaLabel, soilLabel } = useFarmLabels();
  const details = [areaLabel(field.areaInAcres), soilLabel(field.soilType)].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
      <div className="min-w-0">
        <p className="truncate font-medium">{field.name}</p>
        {details && <p className="truncate text-xs text-white/60">{details}</p>}
        {field.boundary && (
          <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-300">
            <MapPinIcon className="size-3" />
            {t("boundary.onMap")}
          </p>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <button type="button" onClick={onDrawBoundary} className={smallButton}>
          {field.boundary ? t("boundary.change") : t("boundary.draw")}
        </button>
        <button type="button" onClick={onEdit} className={smallButton}>
          {t("edit")}
        </button>
        <button type="button" onClick={onDelete} disabled={isDeleting} className={smallButton}>
          {isDeleting ? t("deleting") : t("delete")}
        </button>
      </div>
    </div>
  );
}
