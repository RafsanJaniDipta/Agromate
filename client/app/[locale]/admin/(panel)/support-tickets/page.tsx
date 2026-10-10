import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SupportTicketsManager from "@/components/admin/SupportTicketsManager";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata");
  return { title: t("adminSupportTicketsTitle") };
}

export default function SupportTicketsPage() {
  return <SupportTicketsManager />;
}
