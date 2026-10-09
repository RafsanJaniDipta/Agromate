import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/i18n/params";
import ChatWorkspace from "@/components/chat/ChatWorkspace";

export async function generateMetadata({ params }: PageProps<"/[locale]/expert/messages">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("messagesTitle") };
}

// Chat inside the dashboard. ?c= opens a conversation (links from toasts), ?with= opens
// the chat with a person (the expert directory's "Message" button).
export default async function MessagesPage({ params, searchParams }: PageProps<"/[locale]/expert/messages">) {
  await resolveLocale(params);
  const { c, with: partner } = await searchParams;
  const single = (value: string | string[] | undefined) => (typeof value === "string" ? value : null);

  // Keyed by the link, so following another chat link (e.g. from the bell) while on this page opens it
  return (
    <ChatWorkspace
      key={`${single(c)}-${single(partner)}`}
      initialConversationId={single(c)}
      initialPartnerId={single(partner)}
    />
  );
}
