import { useLocale, useTranslations } from "next-intl";
import { CheckIcon, MapPinIcon } from "@/components/icons";
import ArrowIcon from "@/components/shared/ArrowIcon";
import UserAvatar from "@/components/shared/UserAvatar";
import { chatWithPage } from "@/components/dashboard/experts/chatLink";
import { Link } from "@/i18n/navigation";
import { categoryName, type VerifiedExpert } from "@/lib/expert";

// One verified expert on the public pages (home section and /experts): who they are, what
// they advise on, and a link into the chat. Visitors who aren't signed in land on the login first.
export default function ExpertPublicCard({ expert }: { expert: VerifiedExpert }) {
  const t = useTranslations("experts");
  const locale = useLocale();
  const { user } = expert;

  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl border border-zinc-200 bg-white p-5 text-zinc-900 transition hover:border-brand/40 hover:shadow-lg hover:shadow-zinc-200/60">
      <div className="flex items-start gap-4">
        <UserAvatar name={user.name} image={user.image} size={60} />
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-1.5 font-semibold">
            <span className="truncate">{user.name}</span>
            <span title={t("verified")} className="grid size-4.5 shrink-0 place-items-center rounded-full bg-brand text-white">
              <CheckIcon className="size-3" />
              <span className="sr-only">{t("verified")}</span>
            </span>
          </h3>
          <p className="mt-0.5 text-sm font-medium text-brand">{expert.specialization}</p>
          {expert.organization && <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{expert.organization}</p>}
        </div>
      </div>

      <ul className="flex flex-wrap gap-1.5 text-xs">
        <li className="rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">
          {t("experience", { years: expert.experienceYears })}
        </li>
        {user.location && (
          <li className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-zinc-700">
            <MapPinIcon className="size-3.5" />
            {user.location}
          </li>
        )}
        {expert.categories.map((category) => (
          <li key={category.id} className="rounded-full border border-zinc-200 px-2.5 py-1 text-zinc-600">
            {categoryName(category, locale)}
          </li>
        ))}
      </ul>

      {expert.bio && <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600">{expert.bio}</p>}

      <Link
        href={chatWithPage(user.id)}
        className="group mt-auto inline-flex items-center gap-3 self-start rounded-full bg-zinc-900 py-1 pl-5 pr-1 text-sm font-medium text-white transition hover:bg-brand"
      >
        {t("ask")}
        <ArrowIcon />
      </Link>
    </article>
  );
}
