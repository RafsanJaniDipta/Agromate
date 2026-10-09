"use client";

import { useLocale, useTranslations } from "next-intl";
import { CheckIcon, MapPinIcon } from "@/components/icons";
import DashCard from "@/components/dashboard/DashCard";
import UserAvatar from "@/components/shared/UserAvatar";
import { primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { Link } from "@/i18n/navigation";
import { categoryName, type VerifiedExpert } from "@/lib/expert";
import { chatWithPage } from "@/components/dashboard/experts/chatLink";

type ExpertCardProps = {
  expert: VerifiedExpert;
  onViewProfile: () => void;
};

// One expert in the directory: who they are, what they know, and a way to message them.
export default function ExpertCard({ expert, onViewProfile }: ExpertCardProps) {
  const t = useTranslations("dashboard.expertsPage");
  const locale = useLocale();
  const { user } = expert;

  return (
    <DashCard className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <UserAvatar name={user.name} image={user.image} size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 font-semibold">
            <span className="truncate">{user.name}</span>
            <span title={t("verified")} className="grid size-4.5 shrink-0 place-items-center rounded-full bg-brand">
              <CheckIcon className="size-3" />
              <span className="sr-only">{t("verified")}</span>
            </span>
          </h2>
          <p className="mt-0.5 text-sm text-green-300">{expert.specialization}</p>
          {expert.organization && <p className="mt-1 truncate text-xs text-white/55">{expert.organization}</p>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-white/80">
          {t("experience", { years: expert.experienceYears })}
        </span>
        {user.location && (
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-white/80">
            <MapPinIcon className="size-3.5" />
            {user.location}
          </span>
        )}
        {expert.categories.map((category) => (
          <span key={category.id} className="rounded-full border border-white/15 px-2.5 py-1 text-white/70">
            {categoryName(category, locale)}
          </span>
        ))}
      </div>

      {expert.bio && <p className="line-clamp-3 text-sm leading-relaxed text-white/70">{expert.bio}</p>}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <Link href={chatWithPage(user.id)} className={primaryButton}>
          {t("message")}
        </Link>
        <button type="button" onClick={onViewProfile} className={secondaryButton}>
          {t("viewProfile")}
        </button>
      </div>
    </DashCard>
  );
}
