"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/lib/api";

const topics = ["crop", "market", "weather", "account", "other"] as const;

type Status = "idle" | "sending" | "sent" | "error";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

// Contact form: posts to the backend's /support endpoint and shows the result.
export default function SupportForm() {
  const t = useTranslations("supportPage.form");
  const locale = useLocale();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");

    try {
      await api("/api/support", {
        method: "POST",
        body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), locale }),
      });
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-zinc-100 p-6 md:p-8">
      <h2 className="text-2xl font-semibold tracking-tight">{t("title")}</h2>
      <p className="mt-2 text-sm text-zinc-600">{t("subtitle")}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">
          {t("name")}
          <input name="name" required autoComplete="name" className={fieldClass} />
        </label>
        <label className="text-sm font-medium">
          {t("phone")}
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            className={fieldClass}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium">
        {t("topic")}
        <select name="topic" defaultValue="crop" className={fieldClass}>
          {topics.map((topic) => (
            <option key={topic} value={topic}>
              {t(`topics.${topic}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-4 block text-sm font-medium">
        {t("message")}
        <textarea
          name="message"
          required
          rows={5}
          placeholder={t("messagePlaceholder")}
          className={`${fieldClass} resize-y`}
        />
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {status === "sending" ? t("sending") : t("submit")}
      </button>

      {/* Announced to screen readers when it changes */}
      <p aria-live="polite" className="mt-4 text-sm">
        {status === "sent" && <span className="text-brand">{t("sent")}</span>}
        {status === "error" && <span className="text-red-600">{t("error")}</span>}
      </p>
    </form>
  );
}
