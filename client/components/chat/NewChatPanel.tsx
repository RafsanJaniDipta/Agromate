"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftIcon, SearchIcon } from "@/components/icons";
import UserAvatar from "@/components/shared/UserAvatar";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { getChatContacts, startConversation, type ChatUser, type Conversation } from "@/lib/chat";

type NewChatPanelProps = {
  onStarted: (conversation: Conversation) => void;
  onBack: () => void;
};

// Replaces the conversation list while picking someone to write to: a farmer sees the
// verified experts, an expert the admins, an admin the experts.
export default function NewChatPanel({ onStarted, onBack }: NewChatPanelProps) {
  const t = useTranslations("chat.contacts");
  const tChat = useTranslations("chat");
  const tRoles = useTranslations("roles");
  const me = useCurrentUser();
  const [contacts, setContacts] = useState<ChatUser[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [query, setQuery] = useState("");
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [startFailed, setStartFailed] = useState(false);

  useEffect(() => {
    getChatContacts()
      .then(setContacts)
      .catch(() => setLoadFailed(true));
  }, []);

  const search = query.trim().toLowerCase();
  const matches = contacts?.filter(
    (contact) =>
      contact.name.toLowerCase().includes(search) || contact.specialization?.toLowerCase().includes(search),
  );

  async function open(contact: ChatUser) {
    setOpeningId(contact.id);
    setStartFailed(false);
    try {
      onStarted(await startConversation(contact.id));
    } catch {
      setStartFailed(true);
      setOpeningId(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-white/10 px-2 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("back")}
          className="grid size-10 place-items-center rounded-full hover:bg-white/10"
        >
          <ArrowLeftIcon className="size-5" />
        </button>
        <h2 className="font-semibold">{t(`title.${me.role}`)}</h2>
      </div>

      <div className="px-3 pt-3">
        <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 focus-within:border-white/30">
          <SearchIcon className="size-4 shrink-0 text-white/50" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
          />
        </label>
      </div>

      <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto p-2">
        {startFailed && <p className="p-3 text-sm text-red-300">{t("startError")}</p>}
        {loadFailed && <p className="p-3 text-sm text-red-300">{t("loadError")}</p>}
        {!loadFailed && !contacts && <p className="p-3 text-sm text-white/60">{tChat("loading")}</p>}
        {contacts?.length === 0 && <p className="p-3 text-sm text-white/60">{t(`empty.${me.role}`)}</p>}
        {contacts && contacts.length > 0 && matches?.length === 0 && (
          <p className="p-3 text-sm text-white/60">{t("noMatch", { query: query.trim() })}</p>
        )}

        <ul className="flex flex-col gap-1">
          {matches?.map((contact) => (
            <li key={contact.id}>
              <button
                type="button"
                onClick={() => open(contact)}
                disabled={openingId !== null}
                className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-white/5 disabled:opacity-60"
              >
                <UserAvatar name={contact.name} image={contact.image} size={40} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{contact.name}</span>
                  <span className="block truncate text-xs text-white/50">
                    {contact.specialization ?? tRoles(contact.role)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
