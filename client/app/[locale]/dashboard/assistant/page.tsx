import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import AssistantChat from "@/components/dashboard/assistant/AssistantChat";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/assistant">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("assistantTitle") };
}

// The farmer's AI assistant, which knows their fields, crops, weather and prices.
export default async function Page({ params }: PageProps<"/[locale]/dashboard/assistant">) {
  await resolveLocale(params);
  return <AssistantChat />;
}
