"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { UserIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import { darkInput, darkLabel, primaryButton } from "@/components/dashboard/formStyles";
import { getOwnProfile, saveOwnProfile, type ExpertProfile } from "@/lib/expert";

type Status = "loading" | "idle" | "saving" | "saved" | "error";

// Text inputs of the form, in display order; `multiline` ones are textareas
const textFields = [
  { name: "specialization", required: true },
  { name: "organization" },
  { name: "qualifications" },
  { name: "bio", multiline: true },
] as const;

// Lets an expert fill in or edit their profile. Saving a rejected profile sends it back for review.
export default function ExpertProfileForm() {
  const t = useTranslations("expertDashboard.profile");
  const [profile, setProfile] = useState<ExpertProfile | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    getOwnProfile()
      .then((loaded) => {
        setProfile(loaded);
        setStatus("idle");
      })
      .catch(() => setStatus("error"));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim() || null;

    setStatus("saving");
    try {
      const saved = await saveOwnProfile({
        specialization: text("specialization") ?? "",
        organization: text("organization"),
        qualifications: text("qualifications"),
        bio: text("bio"),
        experienceYears: Number(data.get("experienceYears") || 0),
      });
      setProfile(saved);
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }

  if (status === "loading") {
    return <p className="text-sm text-white/70">{t("loading")}</p>;
  }

  return (
    <DashCard className="max-w-2xl">
      <CardHeader icon={<UserIcon />} title={t("title")} />
      {profile?.status === "REJECTED" && (
        <p className="mt-4 rounded-2xl border border-red-300/30 bg-red-300/10 px-4 py-3 text-sm text-red-100">
          {t("rejected", { reason: profile.rejectionReason ?? "—" })}
        </p>
      )}

      {/* key remounts the form once the profile arrives, so defaultValues are filled in */}
      <form key={profile ? "loaded" : "empty"} onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
        {textFields.map((field) => {
          const id = `profile-${field.name}`;
          const defaultValue = profile?.[field.name] ?? "";
          const isMultiline = "multiline" in field;
          const isRequired = "required" in field;
          return (
            <div key={field.name} className="flex flex-col gap-2">
              <label htmlFor={id} className={darkLabel}>
                {t(`fields.${field.name}`)}
              </label>
              {isMultiline ? (
                <textarea id={id} name={field.name} rows={4} defaultValue={defaultValue} className={darkInput} />
              ) : (
                <input id={id} name={field.name} required={isRequired} defaultValue={defaultValue} className={darkInput} />
              )}
            </div>
          );
        })}

        <div className="flex flex-col gap-2">
          <label htmlFor="profile-experienceYears" className={darkLabel}>
            {t("fields.experienceYears")}
          </label>
          <input
            id="profile-experienceYears"
            name="experienceYears"
            type="number"
            min={0}
            max={70}
            inputMode="numeric"
            defaultValue={profile?.experienceYears ?? 0}
            className={`${darkInput} max-w-40`}
          />
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={status === "saving"} className={primaryButton}>
            {status === "saving" ? t("saving") : t("save")}
          </button>
          <p aria-live="polite" className="text-sm">
            {status === "saved" && <span className="text-green-300">{t("saved")}</span>}
            {status === "error" && <span className="text-red-300">{t("error")}</span>}
          </p>
        </div>
      </form>
    </DashCard>
  );
}
