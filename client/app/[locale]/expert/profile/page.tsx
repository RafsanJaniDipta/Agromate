import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import AccountProfile from "@/components/dashboard/AccountProfile";
import ExpertProfileForm from "@/components/expert/ExpertProfileForm";

export async function generateMetadata({ params }: PageProps<"/[locale]/expert/profile">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("expertProfileTitle") };
}

export default async function ExpertProfilePage({ params }: PageProps<"/[locale]/expert/profile">) {
  await resolveLocale(params);
  // Account details and photo on the left, the expertise an admin reviews on the right;
  // stacked on narrower screens
  return (
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <AccountProfile />
      <ExpertProfileForm />
    </div>
  );
}
