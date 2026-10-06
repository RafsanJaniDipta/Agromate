"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { UserIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import { darkInput, darkLabel, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { ApiError } from "@/lib/api";
import { getProfile, updateProfile, uploadAvatar, type Profile } from "@/lib/profile";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // the server's limit

type SaveStatus = "idle" | "saving" | "saved" | "phoneTaken" | "invalid" | "error";
type PhotoStatus = "idle" | "uploading" | "tooBig" | "notImage" | "error";

// Turns a failed save into the message the user can act on
function saveErrorFor(error: unknown): SaveStatus {
  if (error instanceof ApiError && error.status === 409) return "phoneTaken";
  if (error instanceof ApiError && error.status === 422) return "invalid";
  return "error";
}

// The signed-in user's own account: photo, name, login phone and location. Works for every role.
export default function AccountProfile() {
  const t = useTranslations("accountProfile");
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [photoStatus, setPhotoStatus] = useState<PhotoStatus>("idle");

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(() => setLoadFailed(true));
  }, []);

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // lets the same file be picked again after an error
    if (!file) return;

    // Checked here too, so a big photo fails at once instead of after a slow upload
    if (!file.type.startsWith("image/")) return setPhotoStatus("notImage");
    if (file.size > MAX_AVATAR_BYTES) return setPhotoStatus("tooBig");

    setPhotoStatus("uploading");
    try {
      setProfile(await uploadAvatar(file));
      setPhotoStatus("idle");
    } catch (error) {
      setPhotoStatus(error instanceof ApiError && error.status === 413 ? "tooBig" : "error");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const phone = String(data.get("phone")).trim();

    setSaveStatus("saving");
    try {
      const updated = await updateProfile({
        name: String(data.get("name")),
        location: String(data.get("location")),
        // Only a changed number is sent, so saving a name never re-checks the login phone
        ...(phone && phone !== profile?.phone ? { phone } : {}),
      });
      setProfile(updated);
      setSaveStatus("saved");
    } catch (error) {
      setSaveStatus(saveErrorFor(error));
    }
  }

  if (loadFailed) return <p className="text-sm text-red-300">{t("loadError")}</p>;
  if (!profile) return <p className="text-sm text-white/70">{t("loading")}</p>;

  return (
    <DashCard className="max-w-2xl">
      <CardHeader icon={<UserIcon />} title={t("title")} />

      <div className="mt-5 flex flex-wrap items-center gap-5">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-full border border-white/15 bg-white/10">
          {profile.image ? (
            <Image src={profile.image} alt={t("photoAlt")} fill sizes="96px" className="object-cover" />
          ) : (
            <span aria-hidden className="flex size-full items-center justify-center text-3xl font-semibold text-white/70">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <input ref={fileInput} type="file" accept="image/*" onChange={handlePhoto} className="sr-only" tabIndex={-1} />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={photoStatus === "uploading"}
            className={secondaryButton}
          >
            {photoStatus === "uploading" ? t("photo.uploading") : t("photo.change")}
          </button>
          <p aria-live="polite" className="text-xs text-white/60">
            {photoStatus === "idle" || photoStatus === "uploading" ? (
              t("photo.hint")
            ) : (
              <span className="text-red-300">{t(`photo.${photoStatus}`)}</span>
            )}
          </p>
        </div>
      </div>

      {/* key remounts the inputs when a save returns new values */}
      <form key={`${profile.name}|${profile.phone}|${profile.location}`} onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="profile-name" className={darkLabel}>{t("fields.name")}</label>
          <input id="profile-name" name="name" required autoComplete="name" defaultValue={profile.name} className={darkInput} />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="profile-phone" className={darkLabel}>{t("fields.phone")}</label>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            // Email-only accounts (some experts and admins) may have no phone yet
            required={Boolean(profile.phone)}
            autoComplete="tel"
            defaultValue={profile.phone ?? ""}
            aria-describedby="profile-phone-hint"
            className={darkInput}
          />
          <p id="profile-phone-hint" className="text-xs text-white/50">{t("fields.phoneHint")}</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="profile-location" className={darkLabel}>{t("fields.location")}</label>
          <input
            id="profile-location"
            name="location"
            autoComplete="address-level2"
            placeholder={t("fields.locationPlaceholder")}
            defaultValue={profile.location ?? ""}
            className={darkInput}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saveStatus === "saving"} className={primaryButton}>
            {saveStatus === "saving" ? t("saving") : t("save")}
          </button>
          <p aria-live="polite" className="text-sm">
            {saveStatus === "saved" && <span className="text-green-300">{t("saved")}</span>}
            {(saveStatus === "phoneTaken" || saveStatus === "invalid" || saveStatus === "error") && (
              <span className="text-red-300">{t(`errors.${saveStatus}`)}</span>
            )}
          </p>
        </div>
      </form>
    </DashCard>
  );
}
