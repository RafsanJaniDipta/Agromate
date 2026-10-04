import { useTranslations } from "next-intl";
import { ArrowUpRightIcon } from "@/components/icons";
import { Link } from "@/i18n/navigation";

type CardHeaderProps = {
  icon: React.ReactNode;
  title: string;
  // Optional page with the full details; shows an arrow link on the right
  href?: string;
};

// Icon + title row at the top of a dashboard card.
export default function CardHeader({ icon, title, href }: CardHeaderProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 font-medium">
        <span className="size-5 shrink-0 [&>svg]:size-full">{icon}</span>
        {title}
      </h2>

      {href && (
        <Link
          href={href}
          aria-label={t("openDetails", { title })}
          className="rounded-full p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowUpRightIcon className="size-5" />
        </Link>
      )}
    </div>
  );
}
