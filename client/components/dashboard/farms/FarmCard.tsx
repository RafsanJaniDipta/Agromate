"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { MapPinIcon, PlusIcon } from "@/components/icons";
import DashCard from "@/components/dashboard/DashCard";
import FarmForm from "@/components/dashboard/farms/FarmForm";
import FieldBoundaryEditor from "@/components/dashboard/farms/FieldBoundaryEditor";
import FieldForm from "@/components/dashboard/farms/FieldForm";
import FieldRow from "@/components/dashboard/farms/FieldRow";
import { useFarmLabels } from "@/components/dashboard/farms/useFarmLabels";
import { secondaryButton } from "@/components/dashboard/formStyles";
import { deleteFarm, deleteField, type Farm, type Field } from "@/lib/farms";

export type FarmNotice =
  | "farmAdded"
  | "farmUpdated"
  | "farmDeleted"
  | "fieldAdded"
  | "fieldUpdated"
  | "fieldDeleted"
  | "boundarySaved"
  | "deleteError";

type FarmCardProps = {
  farm: Farm;
  onChange: (farm: Farm) => void;
  onDeleted: (farmId: string) => void;
  onNotice: (notice: FarmNotice) => void;
  // Every field the farmer has, so a new outline can be drawn next to the others
  allFields: Field[];
};

const smallButton = `${secondaryButton} px-3 py-1.5 text-xs`;

// One farm with its details and the fields inside it. Farm and fields are edited in place.
export default function FarmCard({ farm, onChange, onDeleted, onNotice, allFields }: FarmCardProps) {
  const t = useTranslations("dashboard.farmsPage");
  const { areaLabel, soilLabel } = useFarmLabels();
  const [isEditing, setIsEditing] = useState(false);
  // The field being edited, "new" while adding one, or null
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  // The farm or field id being deleted right now
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // The field whose outline is being drawn on the map
  const [drawingField, setDrawingField] = useState<Field | null>(null);

  const details = [farm.location, areaLabel(farm.areaInAcres), soilLabel(farm.soilType)].filter(Boolean).join(" · ");

  function handleFarmSaved(saved: Farm) {
    onChange(saved);
    setIsEditing(false);
    onNotice("farmUpdated");
  }

  function handleFieldSaved(saved: Field) {
    const isNew = !farm.fields.some((field) => field.id === saved.id);
    // A new field goes on top, matching the server's newest-first order
    const fields = isNew
      ? [saved, ...farm.fields]
      : farm.fields.map((field) => (field.id === saved.id ? saved : field));
    onChange({ ...farm, fields });
    setEditingFieldId(null);
    onNotice(isNew ? "fieldAdded" : "fieldUpdated");
  }

  function handleBoundarySaved(saved: Field) {
    onChange({ ...farm, fields: farm.fields.map((field) => (field.id === saved.id ? saved : field)) });
    setDrawingField(null);
    onNotice("boundarySaved");
  }

  async function handleDeleteFarm() {
    if (!window.confirm(t("confirmDeleteFarm", { name: farm.name }))) return;

    setDeletingId(farm.id);
    try {
      await deleteFarm(farm.id);
      onDeleted(farm.id);
      onNotice("farmDeleted");
    } catch {
      onNotice("deleteError");
      setDeletingId(null);
    }
  }

  async function handleDeleteField(field: Field) {
    if (!window.confirm(t("confirmDeleteField", { name: field.name }))) return;

    setDeletingId(field.id);
    try {
      await deleteField(field.id);
      onChange({ ...farm, fields: farm.fields.filter(({ id }) => id !== field.id) });
      onNotice("fieldDeleted");
    } catch {
      onNotice("deleteError");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashCard className="flex flex-col gap-5">
      {isEditing ? (
        <div className="flex flex-col gap-4">
          <h2 className="font-medium">{t("editFarmTitle")}</h2>
          <FarmForm farm={farm} onSaved={handleFarmSaved} onCancel={() => setIsEditing(false)} />
        </div>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand/20 text-brand">
              <MapPinIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{farm.name}</h2>
              <p className="text-sm text-white/60">{details}</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={() => setIsEditing(true)} className={smallButton}>
              {t("edit")}
            </button>
            <button
              type="button"
              onClick={handleDeleteFarm}
              disabled={deletingId === farm.id}
              className={smallButton}
            >
              {deletingId === farm.id ? t("deleting") : t("delete")}
            </button>
          </div>
        </div>
      )}

      <section className="flex flex-col gap-3 border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium">
            {t("fieldsTitle")}{" "}
            <span className="text-white/50">({t("fieldCount", { count: farm.fields.length })})</span>
          </h3>
          {editingFieldId !== "new" && (
            <button
              type="button"
              onClick={() => setEditingFieldId("new")}
              className={`${smallButton} inline-flex items-center gap-1.5`}
            >
              <PlusIcon className="size-3.5" />
              {t("addField")}
            </button>
          )}
        </div>

        {editingFieldId === "new" && (
          <FieldForm
            farmId={farm.id}
            field={null}
            onSaved={handleFieldSaved}
            onCancel={() => setEditingFieldId(null)}
          />
        )}

        {farm.fields.length === 0 && editingFieldId !== "new" && (
          <p className="text-sm text-white/60">{t("noFields")}</p>
        )}

        {farm.fields.length > 0 && (
          <ul className="divide-y divide-white/10">
            {farm.fields.map((field) => (
              <li key={field.id} className={editingFieldId === field.id ? "py-3" : undefined}>
                {editingFieldId === field.id ? (
                  <FieldForm
                    farmId={farm.id}
                    field={field}
                    onSaved={handleFieldSaved}
                    onCancel={() => setEditingFieldId(null)}
                  />
                ) : (
                  <FieldRow
                    field={field}
                    isDeleting={deletingId === field.id}
                    onEdit={() => setEditingFieldId(field.id)}
                    onDelete={() => handleDeleteField(field)}
                    onDrawBoundary={() => setDrawingField(field)}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {drawingField && (
        <FieldBoundaryEditor
          field={drawingField}
          placeLocation={farm.location}
          neighbours={allFields.filter((field) => field.id !== drawingField.id && field.boundary)}
          onSaved={handleBoundarySaved}
          onClose={() => setDrawingField(null)}
        />
      )}
    </DashCard>
  );
}
