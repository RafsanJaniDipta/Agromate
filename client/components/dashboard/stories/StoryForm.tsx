"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import StoryPhotoField from "@/components/dashboard/stories/StoryPhotoField";
import StoryResultsField, { RESULT_FIELDS } from "@/components/dashboard/stories/StoryResultsField";
import { darkInput, darkLabel, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { ApiError } from "@/lib/api";
import { refreshHomeStories } from "@/lib/homeStoriesCache";
import {
  storyTextFor,
  submitStory,
  updateStory,
  uploadStoryPhoto,
  type MyStory,
  type StoryResults,
  type StoryText,
} from "@/lib/successStories";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const QUOTE_MAX = 200; // the server's limits
const QUOTE_MIN = 60;

type FormError = "photoMissing" | "notImage" | "photoTooBig" | "photoError" | "invalid" | "error";
type FormStatus = "idle" | "saving" | FormError;

// The server's limit for the name shown with a story
const NAME_MAX = 40;

// Short text inputs, in display order; limits match the database columns.
// The name isn't asked for: it comes from the farmer's profile.
const textInputs = [
  { name: "role", maxLength: 30, placeholder: "rolePlaceholder" },
  { name: "location", maxLength: 30, autoComplete: "address-level2", placeholder: "locationPlaceholder" },
] as const;

type StoryFormProps = {
  // The story being edited, or null for a new one
  editing: MyStory | null;
  onSaved: (story: MyStory) => void;
  onCancel: () => void;
};

// Form to share a new success story or edit one. Text is saved in the language the site is shown in.
export default function StoryForm({ editing, onSaved, onCancel }: StoryFormProps) {
  const t = useTranslations("dashboard.storiesPage");
  // The story goes out under the signed-in farmer's own name (the server allows 40 characters)
  const farmerName = useCurrentUser().name.slice(0, NAME_MAX);
  const locale = useLocale();
  const savedText = editing ? storyTextFor(editing, locale) : null;

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [quoteLength, setQuoteLength] = useState(savedText?.quote.length ?? 0);
  const [status, setStatus] = useState<FormStatus>("idle");

  function handlePhoto(file: File) {
    // Checked here too, so a wrong file fails at once instead of after a slow upload
    if (!file.type.startsWith("image/")) return setStatus("notImage");
    if (file.size > MAX_PHOTO_BYTES) return setStatus("photoTooBig");
    setPhotoFile(file);
    setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing && !photoFile) return setStatus("photoMissing");

    const data = new FormData(event.currentTarget);
    const text = (name: string) => String(data.get(name) ?? "").trim();
    const storyText: StoryText = {
      name: farmerName,
      role: text("role"),
      location: text("location"),
      quote: text("quote"),
    };
    const results = Object.fromEntries(
      RESULT_FIELDS.map(({ name, field }) => [field, Number(data.get(name))]),
    ) as StoryResults;

    setStatus("saving");

    let photo = null;
    if (photoFile) {
      try {
        photo = await uploadStoryPhoto(photoFile);
      } catch {
        return setStatus("photoError");
      }
    }

    try {
      if (editing) {
        const updated = await updateStory(editing.id, storyText, results, photo, locale);
        // An edited story goes back for review, so it leaves the home page until approved again
        void refreshHomeStories();
        onSaved(updated);
      } else if (photo) {
        onSaved(await submitStory(storyText, results, photo, locale));
      }
    } catch (error) {
      setStatus(error instanceof ApiError && error.status === 422 ? "invalid" : "error");
    }
  }

  const isSaving = status === "saving";
  const error = status !== "idle" && status !== "saving" ? status : null;

  return (
    <DashCard className="p-5 md:p-6">
      <h2 className="font-semibold">{editing ? t("editTitle") : t("formTitle")}</h2>
      {editing && <p className="mt-1 text-sm text-white/55">{t("editNote")}</p>}

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-6">
        {/* Who: photo beside crop and place; the name comes from the profile */}
        <div className="flex flex-col gap-5 sm:flex-row">
          <StoryPhotoField file={photoFile} savedUrl={editing?.imageUrl ?? null} onPick={handlePhoto} />
          <div className="grid min-w-0 flex-1 gap-4">
            {textInputs.map((input) => {
              const id = `story-${input.name}`;
              return (
                <div key={input.name} className="flex flex-col gap-2">
                  <label htmlFor={id} className={darkLabel}>{t(`fields.${input.name}`)}</label>
                  <input
                    id={id}
                    name={input.name}
                    required
                    maxLength={input.maxLength}
                    autoComplete={"autoComplete" in input ? input.autoComplete : "off"}
                    placeholder={"placeholder" in input ? t(`fields.${input.placeholder}`) : undefined}
                    defaultValue={savedText?.[input.name]}
                    className={darkInput}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label htmlFor="story-quote" className={darkLabel}>{t("fields.quote")}</label>
            <textarea
              id="story-quote"
              name="quote"
              required
              rows={4}
              minLength={QUOTE_MIN}
              maxLength={QUOTE_MAX}
              placeholder={t("fields.quotePlaceholder")}
              defaultValue={savedText?.quote}
              onChange={(event) => setQuoteLength(event.target.value.length)}
              aria-describedby="story-quote-count"
              className={`${darkInput} resize-y`}
            />
            <p
              id="story-quote-count"
              className={`text-xs ${quoteLength > 0 && quoteLength < QUOTE_MIN ? "text-amber-300" : "text-white/50"}`}
            >
              {t("fields.quoteCount", { count: quoteLength })}
            </p>
          </div>

          <StoryResultsField saved={editing} />

          {/* Consent is given once, when the story is first shared */}
          {!editing && (
            <label className="flex items-start gap-3 border-t border-white/10 pt-5 text-sm text-white/70">
              <input type="checkbox" name="consent" required className="mt-0.5 size-4 shrink-0 accent-brand" />
              {t("consent")}
            </label>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={isSaving} className={primaryButton}>
              {isSaving ? t("saving") : editing ? t("update") : t("submit")}
            </button>
            {editing && (
              <button type="button" onClick={onCancel} disabled={isSaving} className={secondaryButton}>
                {t("cancel")}
              </button>
            )}
            <p aria-live="polite" className="text-sm text-red-300">
              {error && t(`errors.${error}`)}
            </p>
          </div>
        </div>
      </form>
    </DashCard>
  );
}
