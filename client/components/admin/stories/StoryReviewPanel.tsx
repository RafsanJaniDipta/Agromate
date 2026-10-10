"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import DashCard from "@/components/dashboard/DashCard";
import StoryResultsList from "@/components/dashboard/stories/StoryResultsList";
import StoryStatusBadge from "@/components/dashboard/stories/StoryStatusBadge";
import PhotoFocusPicker from "@/components/admin/stories/PhotoFocusPicker";
import { darkInput, darkLabel, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { ApiError } from "@/lib/api";
import { refreshHomeStories } from "@/lib/homeStoriesCache";
import {
  deleteStoryAsAdmin,
  reviewStory,
  storyTextFor,
  translateStory,
  type AdminStory,
  type StoryReview,
  type StoryStatus,
} from "@/lib/successStories";

// Which submit button was pressed; also the button's `value`
type Intent = "approve" | "reject" | "save";
type PanelError = "reasonMissing" | "invalid" | "error";
export type ReviewNotice = "APPROVED" | "REJECTED" | "saved" | "deleted";

// What each button does to the status ("save" keeps it), and the message shown afterwards
const statusFor: Record<Intent, StoryStatus | undefined> = { approve: "APPROVED", reject: "REJECTED", save: undefined };
const noticeFor: Record<Intent, ReviewNotice> = { approve: "APPROVED", reject: "REJECTED", save: "saved" };

// Text the admin can edit, each in both languages; limits match the database columns
const textRows = [
  { name: "name", maxLength: 40 },
  { name: "role", maxLength: 30 },
  { name: "location", maxLength: 30 },
  { name: "quote", maxLength: 200, minLength: 60, multiline: true },
] as const;
const languages = ["Bn", "En"] as const;

type Suggestions = Partial<Record<string, string>>;
type AiStatus = "idle" | "loading" | "done" | "error";

// AI suggestions already fetched this session, per story version, so reopening a story is free
const suggestionCache = new Map<string, Suggestions>();

// Boxes that are empty in one language while the other language has text: what the AI can fill
function missingColumns(story: AdminStory) {
  return textRows.flatMap(({ name }) =>
    languages.flatMap((language) => {
      const column = `${name}${language}` as const;
      const other = `${name}${language === "Bn" ? "En" : "Bn"}` as const;
      return !story[column]?.trim() && story[other]?.trim() ? [column] : [];
    }),
  );
}

// Only filled-in text is sent, so an empty box never trips the quote's 60-character minimum
function filledText(data: FormData): StoryReview {
  const review: Record<string, string> = {};
  for (const { name } of textRows) {
    for (const language of languages) {
      const column = `${name}${language}`;
      const value = String(data.get(column) ?? "").trim();
      if (value) review[column] = value;
    }
  }
  return review;
}

type StoryReviewPanelProps = {
  story: AdminStory;
  onReviewed: (saved: AdminStory, notice: ReviewNotice) => void;
  onDeleted: (id: string) => void;
};

// Everything an admin needs to check one story: photo focus, both languages,
// home page placement, and approve / reject / delete.
export default function StoryReviewPanel({ story, onReviewed, onDeleted }: StoryReviewPanelProps) {
  const t = useTranslations("admin.stories");
  const format = useFormatter();
  const locale = useLocale();
  const [focus, setFocus] = useState(story.imageFocus);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<PanelError | null>(null);

  // The language the farmer didn't write in is filled by AI when the story opens; the admin checks it
  const cacheKey = `${story.id}-${story.updatedAt}`;
  const needsTranslation = missingColumns(story).length > 0;
  const [suggestions, setSuggestions] = useState<Suggestions>(() => suggestionCache.get(cacheKey) ?? {});
  const [aiStatus, setAiStatus] = useState<AiStatus>(() =>
    suggestionCache.has(cacheKey) ? "done" : needsTranslation ? "loading" : "idle",
  );
  // Bumped when suggestions arrive, so the text boxes remount showing them
  const [textRound, setTextRound] = useState(0);

  function applySuggestions(found: Suggestions) {
    suggestionCache.set(cacheKey, found);
    setSuggestions(found);
    setAiStatus("done");
    setTextRound((round) => round + 1);
  }

  useEffect(() => {
    if (aiStatus !== "loading") return;
    let isCurrent = true;
    translateStory(story.id)
      .then((found) => isCurrent && applySuggestions(found))
      .catch(() => isCurrent && setAiStatus("error"));
    return () => {
      isCurrent = false;
    };
    // Runs once per opened story; retries go through retryTranslation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function retryTranslation() {
    setAiStatus("loading");
    translateStory(story.id)
      .then(applySuggestions)
      .catch(() => setAiStatus("error"));
  }

  const title = storyTextFor(story, locale).name;
  const contact = story.user.phone ?? story.user.email;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const intent = (submitter?.value ?? "save") as Intent;
    const data = new FormData(event.currentTarget);
    const reason = String(data.get("rejectionReason") ?? "").trim();

    if (intent === "reject" && !reason) return setError("reasonMissing");

    const review: StoryReview = {
      ...filledText(data),
      imageFocus: focus,
      isFeatured: data.get("isFeatured") === "on",
      sortOrder: Number(data.get("sortOrder") || 0),
      rejectionReason: reason || undefined,
      status: statusFor[intent],
    };

    setIsBusy(true);
    setError(null);
    try {
      const saved = await reviewStory(story.id, review);
      // The review response has no `user`, so keep the one already loaded
      // The home page shows approved stories, so let it pick up the change straight away
      void refreshHomeStories();
      onReviewed({ ...story, ...saved }, noticeFor[intent]);
    } catch (failure) {
      setError(failure instanceof ApiError && (failure.status === 400 || failure.status === 422) ? "invalid" : "error");
      setIsBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(t("confirmDelete"))) return;

    setIsBusy(true);
    try {
      await deleteStoryAsAdmin(story.id);
      void refreshHomeStories();
      onDeleted(story.id);
    } catch {
      setError("error");
      setIsBusy(false);
    }
  }

  return (
    <DashCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-white/60">
            {t("sentBy", {
              name: story.user.name,
              date: format.dateTime(new Date(story.createdAt), { dateStyle: "medium" }),
            })}
            {contact && ` · ${contact}`}
          </p>
        </div>
        <StoryStatusBadge status={story.status} />
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="flex flex-col gap-5">
          <PhotoFocusPicker imageUrl={story.imageUrl} focus={focus} onChange={setFocus} />
          <StoryResultsList results={story} />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <fieldset key={textRound} className="flex flex-col gap-4">
            <legend className="font-medium">{t("text.title")}</legend>
            <p className="-mt-2 text-xs text-white/50">{t("text.hint")}</p>

            {/* What the AI is doing with the missing language */}
            {aiStatus === "loading" && (
              <p role="status" className="flex items-center gap-2 text-sm text-white/70">
                <span className="size-4 animate-spin rounded-full border-2 border-white/20 border-t-emerald-400" />
                {t("ai.translating")}
              </p>
            )}
            {aiStatus === "done" && Object.keys(suggestions).length > 0 && (
              <p role="status" className="rounded-2xl border border-sky-300/30 bg-sky-300/10 px-3 py-2 text-sm text-sky-100">
                {t("ai.done")}
              </p>
            )}
            {aiStatus === "error" && (
              <p role="status" className="flex flex-wrap items-center gap-2 text-sm text-amber-200">
                {t("ai.failed")}
                <button type="button" onClick={retryTranslation} className="underline hover:no-underline">
                  {t("ai.retry")}
                </button>
              </p>
            )}

            {textRows.map((row) => (
              <div key={row.name} className="grid gap-3 sm:grid-cols-2">
                {languages.map((language) => {
                  const column = `${row.name}${language}` as const;
                  const id = `review-${column}`;
                  const props = {
                    id,
                    name: column,
                    // Approving needs both languages; reject and save skip this check
                    required: true,
                    maxLength: row.maxLength,
                    minLength: "minLength" in row ? row.minLength : undefined,
                    // Saved text first, else the AI's suggestion for this empty box
                    defaultValue: story[column] || suggestions[column] || "",
                    readOnly: aiStatus === "loading",
                    className: darkInput,
                  };
                  return (
                    <div key={language} className="flex flex-col gap-2">
                      <label htmlFor={id} className={darkLabel}>
                        {t(`text.${row.name}`)} · <span className="text-white/50">{t(`text.${language === "Bn" ? "bn" : "en"}`)}</span>
                        {!story[column] && suggestions[column] && (
                          <span className="ml-2 rounded-full bg-sky-300/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
                            {t("ai.tag")}
                          </span>
                        )}
                      </label>
                      {"multiline" in row ? <textarea rows={4} {...props} /> : <input {...props} />}
                    </div>
                  );
                })}
              </div>
            ))}
          </fieldset>

          <fieldset className="flex flex-col gap-3">
            <legend className="font-medium">{t("homePage.title")}</legend>
            <div className="flex flex-wrap items-end gap-5">
              <label className="flex items-center gap-3 text-sm text-white/80">
                <input
                  type="checkbox"
                  name="isFeatured"
                  defaultChecked={story.isFeatured}
                  className="size-4 accent-brand"
                />
                {t("homePage.featured")}
              </label>
              <div className="flex flex-col gap-2">
                <label htmlFor="review-sortOrder" className={darkLabel}>{t("homePage.sortOrder")}</label>
                <input
                  id="review-sortOrder"
                  name="sortOrder"
                  type="number"
                  step={1}
                  defaultValue={story.sortOrder}
                  className={`${darkInput} max-w-32`}
                />
              </div>
            </div>
            <p className="text-xs text-white/50">{t("homePage.featuredHint")}</p>
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="review-rejectionReason" className={darkLabel}>{t("rejectionReason")}</label>
            <textarea
              id="review-rejectionReason"
              name="rejectionReason"
              rows={2}
              defaultValue={story.rejectionReason ?? ""}
              aria-describedby="review-rejectionHint"
              className={darkInput}
            />
            <p id="review-rejectionHint" className="text-xs text-white/50">{t("rejectionHint")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" value="approve" disabled={isBusy || aiStatus === "loading"} className={primaryButton}>
              {isBusy ? t("actions.saving") : t("actions.approve")}
            </button>
            <button
              type="submit"
              value="reject"
              formNoValidate
              disabled={isBusy}
              className="rounded-full border border-red-300/30 px-5 py-2.5 text-sm font-medium text-red-200 transition hover:bg-red-300/10 disabled:opacity-60"
            >
              {t("actions.reject")}
            </button>
            <button type="submit" value="save" formNoValidate disabled={isBusy} className={secondaryButton}>
              {t("actions.save")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isBusy}
              className="ml-auto text-sm text-red-300 underline-offset-4 transition hover:underline disabled:opacity-60"
            >
              {t("actions.delete")}
            </button>
          </div>
          <p aria-live="polite" className="-mt-3 text-sm text-red-300">
            {error && t(`errors.${error}`)}
          </p>
        </div>
      </form>
    </DashCard>
  );
}
