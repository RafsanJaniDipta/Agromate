"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { api, ApiError } from "@/lib/api";
import { PasswordField, TextField } from "@/components/auth/AuthFields";

type Status = "idle" | "sending" | "mismatch" | "phoneTaken" | "error";

type AccountType = "FARMER" | "EXPERT";

const ACCOUNT_TYPES: AccountType[] = ["FARMER", "EXPERT"];

const MIN_PASSWORD_LENGTH = 8;

// Sign-up form for farmers and expert applicants: checks the two passwords match,
// posts to /api/auth/register, then sends the user to the login page.
// Experts start as "pending" until an admin verifies them.
export default function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [accountType, setAccountType] = useState<AccountType>("FARMER");
  const isExpert = accountType === "EXPERT";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const password = data.get("password");

    if (password !== data.get("confirmPassword")) {
      setStatus("mismatch");
      return;
    }

    setStatus("sending");

    try {
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          phone: data.get("phone"),
          password,
          locale,
          role: accountType,
          ...(isExpert && {
            specialization: data.get("specialization"),
            organization: data.get("organization") || undefined,
            experienceYears: Number(data.get("experienceYears") || 0),
          }),
        }),
      });
      router.push("/login");
    } catch (error) {
      setStatus(error instanceof ApiError && error.status === 409 ? "phoneTaken" : "error");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("register.title")}</h1>
      <p className="mt-2 text-sm text-zinc-600">{t("register.subtitle")}</p>

      <fieldset className="mt-8">
        <legend className="text-sm font-medium">{t("register.accountType")}</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-full bg-white p-1">
          {ACCOUNT_TYPES.map((type) => (
            <label
              key={type}
              className={`cursor-pointer rounded-full px-4 py-2 text-center text-sm font-medium transition has-focus-visible:ring-2 has-focus-visible:ring-brand/40 ${
                accountType === type ? "bg-brand text-white" : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <input
                type="radio"
                name="accountType"
                value={type}
                checked={accountType === type}
                onChange={() => setAccountType(type)}
                className="sr-only"
              />
              {t(`register.types.${type}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 space-y-4">
        <TextField label={t("fields.name")} name="name" required autoComplete="name" />
        <TextField
          label={t("fields.phone")}
          hint={t("fields.phoneHint")}
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          inputMode="tel"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            label={t("fields.password")}
            hint={t("fields.passwordHint", { min: MIN_PASSWORD_LENGTH })}
            name="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
          <PasswordField
            label={t("fields.confirmPassword")}
            name="confirmPassword"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
          />
        </div>

        {isExpert && (
          <>
            <TextField
              label={t("fields.specialization")}
              hint={t("fields.specializationHint")}
              name="specialization"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label={t("fields.organization")} name="organization" autoComplete="organization" />
              <TextField
                label={t("fields.experienceYears")}
                name="experienceYears"
                type="number"
                min={0}
                max={70}
                inputMode="numeric"
              />
            </div>
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">{t("register.expertReviewNote")}</p>
          </>
        )}
      </div>

      <label className="mt-5 flex items-start gap-2 text-sm text-zinc-600">
        <input name="terms" type="checkbox" required className="mt-0.5 size-4 shrink-0 accent-brand" />
        <span>
          {/* Placeholder links until the legal pages exist */}
          {t.rich("register.terms", {
            terms: (chunks) => (
              <Link href="#" className="font-medium text-brand hover:underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="#" className="font-medium text-brand hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-8 w-full rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {status === "sending" ? t("register.submitting") : t("register.submit")}
      </button>

      {/* Announced to screen readers when it changes */}
      <p aria-live="polite" className="mt-4 text-sm text-red-600">
        {status === "mismatch" && t("register.passwordMismatch")}
        {status === "phoneTaken" && t("register.phoneTaken")}
        {status === "error" && t("register.error")}
      </p>

      <p className="mt-6 text-center text-sm text-zinc-600">
        {t("register.hasAccount")}{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          {t("register.loginLink")}
        </Link>
      </p>
    </form>
  );
}
