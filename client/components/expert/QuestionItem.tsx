"use client";

import { useState, type FormEvent } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { darkInput, primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { answerQuestion, type OpenQuestion } from "@/lib/expert";

type QuestionItemProps = {
  question: OpenQuestion;
  // Only verified experts may answer; others see the question read-only
  canAnswer: boolean;
  onAnswered: (questionId: string) => void;
};

type Status = "idle" | "sending" | "error";

// One farmer question with an inline answer box.
export default function QuestionItem({ question, canAnswer, onAnswered }: QuestionItemProps) {
  const t = useTranslations("expertDashboard.queue");
  const format = useFormatter();
  const locale = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  // Crop names are stored in both languages; fall back to English when Bangla is missing
  const cropName = question.crop && (locale === "bn" ? (question.crop.nameBn ?? question.crop.name) : question.crop.name);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = String(new FormData(event.currentTarget).get("content")).trim();
    if (!content) return;

    setStatus("sending");
    try {
      await answerQuestion(question.id, content);
      onAnswered(question.id);
    } catch {
      setStatus("error");
    }
  }

  return (
    <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="font-medium">{question.title}</p>
      {question.description && <p className="mt-1 text-sm text-white/70">{question.description}</p>}
      <p className="mt-2 text-xs text-white/50">
        {question.user.name}
        {cropName && ` · ${cropName}`}
        {" · "}
        {format.relativeTime(new Date(question.createdAt))}
      </p>

      {canAnswer && !isOpen && (
        <button type="button" onClick={() => setIsOpen(true)} className={`mt-3 ${secondaryButton}`}>
          {t("answer")}
        </button>
      )}

      {canAnswer && isOpen && (
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
          <label htmlFor={`answer-${question.id}`} className="sr-only">
            {t("answerLabel")}
          </label>
          <textarea
            id={`answer-${question.id}`}
            name="content"
            required
            rows={3}
            placeholder={t("answerPlaceholder")}
            className={darkInput}
          />
          <div className="flex gap-2">
            <button type="submit" disabled={status === "sending"} className={primaryButton}>
              {status === "sending" ? t("sending") : t("send")}
            </button>
            <button type="button" onClick={() => setIsOpen(false)} className={secondaryButton}>
              {t("cancel")}
            </button>
          </div>
          <p aria-live="polite" className="text-sm text-red-300">
            {status === "error" && t("sendError")}
          </p>
        </form>
      )}
    </li>
  );
}
