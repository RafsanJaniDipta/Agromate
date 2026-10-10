import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "@/components/icons";

// Question/answer text lives in messages under supportPage.faq
const questionIds = ["cost", "advice", "prices", "language", "crops"] as const;

// Accordion built on <details>, so it works without JavaScript and with the keyboard.
export default function FaqList() {
  const t = useTranslations("supportPage");

  return (
    <div>
      <span className="inline-block rounded-full border border-zinc-200 px-4 py-1.5 text-xs">
        {t("faqBadge")}
      </span>
      <h2 className="mt-5 text-3xl font-semibold tracking-tight">{t("faqTitle")}</h2>

      <div className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200">
        {questionIds.map((id, index) => (
          <details key={id} open={index === 0} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
              {t(`faq.${id}.q`)}
              <ChevronDownIcon className="size-5 shrink-0 text-zinc-400 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm text-zinc-600">{t(`faq.${id}.a`)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
