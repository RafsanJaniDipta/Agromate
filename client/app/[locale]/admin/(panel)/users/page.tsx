import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import UsersManager from "@/components/admin/UsersManager";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/users">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("adminUsersTitle") };
}

export default async function AdminUsersPage({ params }: PageProps<"/[locale]/admin/users">) {
  await resolveLocale(params);
  return <UsersManager />;
}
