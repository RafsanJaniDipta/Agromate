import { useTranslations } from "next-intl";
import { ChartIcon, LeafIcon, ShieldIcon, UserIcon } from "@/components/icons";

// Text for each id lives in messages under aboutPage.values
const values = [
  { id: "farmers", Icon: UserIcon },
  { id: "data", Icon: ChartIcon },
  { id: "sustainability", Icon: LeafIcon },
  { id: "trust", Icon: ShieldIcon },
] as const;

// Four principle cards on a light grey band.
export default function ValuesSection() {
  const t = useTranslations("aboutPage");

  return (
    <section className="bg-white p-2 text-zinc-900 md:p-3">
      <div className="rounded-3xl bg-linear-to-br from-zinc-100 via-zinc-50 to-zinc-200">
        <div className="site-container py-14 md:py-20">
          <span className="inline-block rounded-full border border-zinc-300 px-4 py-1.5 text-xs">
            {t("valuesBadge")}
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-5xl">
            {t("valuesTitle")}
          </h2>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ id, Icon }) => (
              <li key={id} className="rounded-3xl bg-white p-6 shadow-sm">
                <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 text-brand">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{t(`values.${id}.title`)}</h3>
                <p className="mt-2 text-sm text-zinc-600">{t(`values.${id}.text`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
