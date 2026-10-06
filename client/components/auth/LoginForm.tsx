"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { dashboardFor } from "@/lib/session";
import { PasswordField, TextField } from "@/components/auth/AuthFields";

type Status = "idle" | "sending" | "error";

// Phone + password login: posts to the backend's /api/auth/login, then opens the dashboard for the user's role.
export default function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      const { data } = await api<{ data: { role: string } }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      router.push(dashboardFor(data.role));
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("login.title")}</h1>
      <p className="mt-2 text-sm text-zinc-600">{t("login.subtitle")}</p>

      <div className="mt-8 space-y-4">
        <TextField
          label={t("fields.phone")}
          hint={t("fields.phoneHint")}
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
        />
        <PasswordField
          label={t("fields.password")}
          name="password"
          required
          autoComplete="current-password"
        />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2 text-zinc-600">
          <input name="remember" type="checkbox" className="size-4 accent-brand" />
          {t("login.remember")}
        </label>
        {/* Placeholder until the password reset page exists */}
        <Link href="#" className="font-medium text-brand hover:underline">
          {t("login.forgot")}
        </Link>
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-8 w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? t("login.submitting") : t("login.submit")}
      </button>

      {/* Announced to screen readers when it changes */}
      <p aria-live="polite" className="mt-4 text-sm text-red-600">
        {status === "error" && t("login.error")}
      </p>

      <p className="mt-6 text-center text-sm text-zinc-600">
        {t("login.noAccount")}{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          {t("login.registerLink")}
        </Link>
      </p>
    </form>
  );
}
