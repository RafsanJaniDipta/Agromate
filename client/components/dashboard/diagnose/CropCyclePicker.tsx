"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import FormRow from "@/components/dashboard/FormRow";
import { darkInput } from "@/components/dashboard/formStyles";
import type { DiagnosisState } from "@/components/dashboard/diagnose/useDiagnosis";
import { ACTIVE_STATUSES, getCropCycles, type CropCycle } from "@/lib/cropCycles";
import { cropName } from "@/lib/crops";

// Optional "which crop is this?" so the saved check shows up against that field's crop.
// Lists only crops still on the field; hidden when the farmer has none.
export default function CropCyclePicker({ diagnosis }: { diagnosis: DiagnosisState }) {
  const t = useTranslations("dashboard.diagnose");
  const locale = useLocale();
  const [cycles, setCycles] = useState<CropCycle[]>([]);
  const { cropCycleId, setCropCycleId, status } = diagnosis;

  // Without the list the check still works, just unlinked
  useEffect(() => {
    getCropCycles()
      .then((loaded) => setCycles(loaded.filter((cycle) => ACTIVE_STATUSES.includes(cycle.status))))
      .catch(() => {});
  }, []);

  if (cycles.length === 0) return null;

  return (
    <FormRow id="diagnose-crop" label={t("cropLinkLabel")}>
      <select
        id="diagnose-crop"
        value={cropCycleId}
        onChange={(event) => setCropCycleId(event.target.value)}
        disabled={status === "loading"}
        className={`${darkInput} py-2.5`}
      >
        <option value="" className="bg-zinc-900">
          {t("cropLinkNone")}
        </option>
        {cycles.map((cycle) => (
          <option key={cycle.id} value={cycle.id} className="bg-zinc-900">
            {t("cropLinkOption", { crop: cropName(cycle.crop, locale), field: cycle.field.name })}
          </option>
        ))}
      </select>
    </FormRow>
  );
}
