import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import StaffShell from "@/components/admin/StaffShell";
import StaffLoginForm from "@/components/admin/StaffLoginForm";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/login">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("adminLoginTitle") };
}

export default async function AdminLoginPage({ params }: PageProps<"/[locale]/admin/login">) {
  await resolveLocale(params);

  return (
    <StaffShell>
      <StaffLoginForm />
    </StaffShell>
  );
}
