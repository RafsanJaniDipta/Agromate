"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { FarmerAccountError, signInStaff } from "@/lib/admin";
import { dashboardFor } from "@/lib/session";
import { PasswordField, TextField } from "@/components/auth/AuthFields";

type Status = "idle" | "sending" | "error" | "farmer";

// Email + password login for admins and experts; each lands on their own dashboard.
export default function StaffLoginForm() {
  const t = useTranslations("admin.login");
  const tFields = useTranslations("auth.fields");
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setStatus("sending");

    try {
      const role = await signInStaff(
        String(data.get("email")),
        String(data.get("password")),
        data.has("remember"),
      );
      router.push(dashboardFor(role));
    } catch (error) {
      setStatus(error instanceof FarmerAccountError ? "farmer" : "error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{t("title")}</h1>
      <p className="mt-2 text-sm text-zinc-600">{t("subtitle")}</p>

      <div className="mt-8 space-y-4">
        <TextField label={t("email")} name="email" type="email" required autoComplete="username" />
        <PasswordField
          label={tFields("password")}
          name="password"
          required
          autoComplete="current-password"
        />
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-zinc-600">
        <input name="remember" type="checkbox" className="size-4 accent-brand" />
        {t("remember")}
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-8 w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? t("submitting") : t("submit")}
      </button>

      {/* Announced to screen readers when it changes */}
      <p aria-live="polite" className="mt-4 text-sm text-red-600">
        {status === "error" && t("error")}
        {status === "farmer" &&
          t.rich("farmerAccount", {
            link: (chunks) => (
              <Link href="/login" className="font-medium text-brand hover:underline">
                {chunks}
              </Link>
            ),
          })}
      </p>
    </form>
  );
}
