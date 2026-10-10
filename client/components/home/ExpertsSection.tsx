import { useTranslations } from "next-intl";
import ExpertPublicCard from "@/components/experts/ExpertPublicCard";
import ArrowIcon from "@/components/shared/ArrowIcon";
import { Link } from "@/i18n/navigation";
import type { VerifiedExpert } from "@/lib/expert";

// How many experts the home page shows; the rest are on /experts
const EXPERTS_SHOWN = 4;

// "Our experts" on the home page: the most experienced few, and a link to all of them.
// Nothing is shown until at least one expert is verified.
export default function ExpertsSection({ experts }: { experts: VerifiedExpert[] }) {
  const t = useTranslations("experts");
  if (experts.length === 0) return null;

  return (
    <section id="experts" className="bg-white p-2 text-zinc-900 md:p-3">
      <div className="rounded-3xl bg-linear-to-br from-zinc-100 via-zinc-50 to-zinc-200 py-16 md:py-24">
        <div className="site-container">
          <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="inline-block rounded-full border border-zinc-300 px-4 py-1.5 text-xs">{t("badge")}</span>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">{t("title")}</h2>
              <p className="mt-4 max-w-xl text-sm text-zinc-600">{t("intro")}</p>
            </div>
            <Link
              href="/experts"
              className="group inline-flex items-center gap-3 rounded-full bg-brand py-1.5 pl-6 pr-1.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              {t("viewAll")}
              <ArrowIcon />
            </Link>
          </div>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {experts.slice(0, EXPERTS_SHOWN).map((expert, index) => (
              // --i staggers the reveal, one card after another
              <li key={expert.id} data-reveal style={{ "--i": index }}>
                <ExpertPublicCard expert={expert} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
