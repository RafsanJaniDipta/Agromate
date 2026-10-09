"use client";

import { useTranslations } from "next-intl";
import { darkInput, darkLabel } from "@/components/dashboard/formStyles";
import type { Farm } from "@/lib/farms";

type FieldSelectProps = {
  farms: Farm[];
  value: string;
  onChange: (fieldId: string) => void;
};

// The farmer's fields grouped by place, or "no field" to type the soil / area instead
export default function FieldSelect({ farms, value, onChange }: FieldSelectProps) {
  const t = useTranslations("advice");

  return (
    <label className="flex flex-col gap-2">
      <span className={darkLabel}>{t("field")}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={darkInput}>
        <option value="" className="bg-zinc-900">
          {t("noField")}
        </option>
        {farms
          .filter((farm) => farm.fields.length > 0)
          .map((farm) => (
            <optgroup key={farm.id} label={farm.name} className="bg-zinc-900">
              {farm.fields.map((field) => (
                <option key={field.id} value={field.id} className="bg-zinc-900">
                  {field.name}
                </option>
              ))}
            </optgroup>
          ))}
      </select>
    </label>
  );
}
