import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import AccountProfile from "@/components/dashboard/AccountProfile";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard/profile">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("profileTitle") };
}

export default async function FarmerProfilePage({ params }: PageProps<"/[locale]/dashboard/profile">) {
  await resolveLocale(params);
  return <AccountProfile />;
}
