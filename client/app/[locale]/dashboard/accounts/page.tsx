import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import DashCard from "@/components/dashboard/DashCard";
import AccountsBook from "@/components/dashboard/ledger/AccountsBook";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard/accounts">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("accountsTitle") };
}

// Farmer's account book: every cost and sale for a year or month, in one place.
export default async function AccountsPage({ params }: PageProps<"/[locale]/dashboard/accounts">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard.accountsPage" });

  return (
    <div className="flex flex-col gap-5">
      <DashCard>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-white/70">{t("intro")}</p>
      </DashCard>

      <AccountsBook />
    </div>
  );
}
