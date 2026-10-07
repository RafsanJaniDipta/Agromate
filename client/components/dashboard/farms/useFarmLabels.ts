import { useTranslations } from "next-intl";
import { isSoilType } from "@/lib/farms";

// Display text for the area and soil of a farm or field; null when there's nothing to show.
export function useFarmLabels() {
  const t = useTranslations("dashboard.farmsPage");

  return {
    // 0 is the server's default for "not given", so it's hidden like a missing area
    areaLabel: (area: number | null) => (area ? t("acres", { value: area }) : null),
    // Older rows may hold free text instead of a code; show those as stored
    soilLabel: (soil: string | null) => (soil && isSoilType(soil) ? t(`soils.${soil}`) : soil),
  };
}
