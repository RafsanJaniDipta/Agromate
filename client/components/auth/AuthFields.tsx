"use client";

import { useId, useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

type FieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  // Small help text under the input, read out by screen readers with the field
  hint?: string;
};

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

type FieldFrameProps = {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
};

function FieldFrame({ id, label, hint, children }: FieldFrameProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative mt-2">{children}</div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-zinc-500">
          {hint}
        </p>
      )}
    </div>
  );
}

// Labelled text input in the site's form style.
export function TextField({ label, hint, ...inputProps }: FieldProps) {
  const id = useId();

  return (
    <FieldFrame id={id} label={label} hint={hint}>
      <input
        {...inputProps}
        id={id}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={inputClass}
      />
    </FieldFrame>
  );
}

// Password input with an eye button that shows or hides what was typed.
export function PasswordField({ label, hint, ...inputProps }: FieldProps) {
  const t = useTranslations("auth.fields");
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <FieldFrame id={id} label={label} hint={hint}>
      <input
        {...inputProps}
        id={id}
        type={visible ? "text" : "password"}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-zinc-400 transition hover:text-zinc-700"
      >
        {visible ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
      </button>
    </FieldFrame>
  );
}
