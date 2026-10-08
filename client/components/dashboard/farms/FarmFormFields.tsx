import { useTranslations } from "next-intl";
import { darkInput } from "@/components/dashboard/formStyles";
import { SOIL_TYPES, isSoilType } from "@/lib/farms";

// Area in acres, with the decimal (শতাংশ) conversion farmers know
export function AreaInput({ id, defaultValue }: { id: string; defaultValue: number | null }) {
  const t = useTranslations("dashboard.farmsPage");

  return (
    <>
      <input
        id={id}
        name="areaInAcres"
        type="number"
        min={0}
        step="0.01"
        // 0 is the server's "not given", so the box starts empty instead
        defaultValue={defaultValue || ""}
        aria-describedby={`${id}-hint`}
        className={darkInput}
      />
      <span id={`${id}-hint`} className="text-xs text-white/50">
        {t("areaHint")}
      </span>
    </>
  );
}

// Soil type picker. A free-text value saved before the codes existed is kept as an extra option.
export function SoilSelect({ id, defaultValue }: { id: string; defaultValue: string | null }) {
  const t = useTranslations("dashboard.farmsPage");
  const legacyValue = defaultValue && !isSoilType(defaultValue) ? defaultValue : null;

  return (
    <select id={id} name="soilType" defaultValue={defaultValue ?? ""} className={darkInput}>
      <option value="" className="bg-zinc-900">
        {t("soilNotSet")}
      </option>
      {SOIL_TYPES.map((soil) => (
        <option key={soil} value={soil} className="bg-zinc-900">
          {t(`soils.${soil}`)}
        </option>
      ))}
      {legacyValue && (
        <option value={legacyValue} className="bg-zinc-900">
          {legacyValue}
        </option>
      )}
    </select>
  );
}

// Reads the area and soil inputs; a blank area is left out so the server keeps its value
export function readAreaAndSoil(data: FormData) {
  const area = String(data.get("areaInAcres") ?? "").trim();
  const soil = String(data.get("soilType") ?? "");
  return {
    areaInAcres: area === "" ? undefined : Number(area),
    soilType: soil === "" ? null : soil,
  };
}
