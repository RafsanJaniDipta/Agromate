"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckIcon, CloseIcon } from "@/components/icons";
import UserAvatar from "@/components/shared/UserAvatar";
import { primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { Link } from "@/i18n/navigation";
import { categoryName, type VerifiedExpert } from "@/lib/expert";
import { chatWithPage } from "@/components/dashboard/experts/chatLink";

type ExpertProfileDialogProps = {
  expert: VerifiedExpert;
  onClose: () => void;
};

// Full profile in a modal. A native <dialog> sits above the page's blurred cards,
// traps focus and closes on Escape by itself; a click on the dimmed backdrop closes it too.
export default function ExpertProfileDialog({ expert, onClose }: ExpertProfileDialogProps) {
  const t = useTranslations("dashboard.expertsPage");
  const locale = useLocale();
  const dialog = useRef<HTMLDialogElement>(null);
  const { user } = expert;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const details = [
    { label: t("profile.organization"), value: expert.organization },
    { label: t("profile.location"), value: user.location },
  ].filter((detail) => detail.value);

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && dialog.current?.close()}
      aria-labelledby="expert-profile-name"
      className="m-auto max-h-[85svh] w-[min(36rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <div data-lenis-prevent className="max-h-[85svh] overflow-y-auto p-6">
        <div className="flex items-start gap-4">
          <UserAvatar name={user.name} image={user.image} size={72} />
          <div className="min-w-0 flex-1">
            <h2 id="expert-profile-name" className="flex items-center gap-1.5 text-lg font-semibold">
              <span className="truncate">{user.name}</span>
              <span title={t("verified")} className="grid size-5 shrink-0 place-items-center rounded-full bg-brand">
                <CheckIcon className="size-3.5" />
                <span className="sr-only">{t("verified")}</span>
              </span>
            </h2>
            <p className="mt-0.5 text-sm text-green-300">{expert.specialization}</p>
            <p className="mt-1 text-xs text-white/55">{t("experience", { years: expert.experienceYears })}</p>
          </div>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label={t("profile.close")}
            className="grid size-9 shrink-0 place-items-center rounded-full text-white/60 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>

        {details.length > 0 && (
          <dl className="mt-5 grid gap-3 rounded-2xl bg-white/5 p-4 text-sm sm:grid-cols-2">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt className="text-xs text-white/50">{detail.label}</dt>
                <dd className="mt-0.5">{detail.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {expert.categories.length > 0 && (
          <section className="mt-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-white/50">{t("profile.subjects")}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {expert.categories.map((category) => (
                <span key={category.id} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/80">
                  {categoryName(category, locale)}
                </span>
              ))}
            </div>
          </section>
        )}

        {expert.bio && (
          <section className="mt-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-white/50">{t("profile.about")}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/80">{expert.bio}</p>
          </section>
        )}

        {expert.qualifications && (
          <section className="mt-5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-white/50">{t("profile.qualifications")}</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/80">{expert.qualifications}</p>
          </section>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={chatWithPage(user.id)} className={primaryButton}>
            {t("message")}
          </Link>
          <button type="button" onClick={() => dialog.current?.close()} className={secondaryButton}>
            {t("profile.close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
