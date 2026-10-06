import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import AdminOverview from "@/components/admin/AdminOverview";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("adminTitle") };
}

export default async function AdminPage({ params }: PageProps<"/[locale]/admin">) {
  await resolveLocale(params);
  return <AdminOverview />;
}
