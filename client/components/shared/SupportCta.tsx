import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ArrowIcon from "@/components/shared/ArrowIcon";

// Green banner that sends visitors to the support page.
export default function SupportCta() {
  const t = useTranslations("cta");

  return (
    <section className="bg-white p-2 md:p-3">
      <div className="rounded-3xl bg-brand text-white">
        <div className="site-container flex flex-col items-start justify-between gap-6 py-12 md:flex-row md:items-center md:py-16">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h2>
            <p className="mt-3 text-white/85">{t("text")}</p>
          </div>
          <Link
            href="/support"
            className="group inline-flex shrink-0 items-center gap-3 rounded-full bg-white py-1.5 pl-6 pr-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white/90"
          >
            {t("button")}
            <ArrowIcon className="size-9 bg-brand text-white" />
          </Link>
        </div>
      </div>
    </section>
  );
}
