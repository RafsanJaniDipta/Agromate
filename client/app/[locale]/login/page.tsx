import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export async function generateMetadata({ params }: PageProps<"/[locale]/login">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("loginTitle") };
}

export default async function LoginPage({ params }: PageProps<"/[locale]/login">) {
  await resolveLocale(params);

  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
