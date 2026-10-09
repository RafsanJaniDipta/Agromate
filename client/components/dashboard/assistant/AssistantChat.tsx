"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CloseIcon, PlusIcon, SendIcon, SparkIcon } from "@/components/icons";
import { ApiError } from "@/lib/api";
import {
  askAssistant,
  deleteAssistantConversation,
  getAssistantConversations,
  getAssistantMessages,
  QUESTION_MAX_LENGTH,
  startAssistantConversation,
  type AssistantConversation,
  type AssistantMessage,
} from "@/lib/assistant";

type Status = "idle" | "asking" | "error" | "tooMany" | "tooLong" | "loadError";

// The farmer's AI assistant: earlier questions on the left (wide screens), the conversation on
// the right. A new question shows at once with "thinking…" until the answer arrives.
export default function AssistantChat() {
  const t = useTranslations("assistant");
  const format = useFormatter();
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const scroller = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const pendingCount = useRef(0);

  useEffect(() => {
    getAssistantConversations()
      .then(setConversations)
      .catch(() => {});
  }, []);

  // The newest message (or "thinking…") stays in view
  useLayoutEffect(() => {
    const element = scroller.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, status]);

  function openConversation(id: string | null) {
    setSelectedId(id);
    setMessages([]);
    setStatus("idle");
    if (!id) {
      textarea.current?.focus();
      return;
    }
    getAssistantMessages(id)
      .then(setMessages)
      .catch(() => setStatus("loadError"));
  }

  async function ask(text: string) {
    const question = text.trim();
    if (!question || status === "asking") return;
    if (question.length > QUESTION_MAX_LENGTH) return setStatus("tooLong");

    pendingCount.current += 1;
    const pending: AssistantMessage = {
      id: `pending-${pendingCount.current}`,
      sender: "USER",
      content: question,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, pending]);
    setDraft("");
    setStatus("asking");

    try {
      if (selectedId) {
        const { question: saved, answer } = await askAssistant(selectedId, question);
        setMessages((current) => [...current.filter((message) => message.id !== pending.id), saved, answer]);
        // The conversation moves to the top of the list
        setConversations((current) => {
          const conversation = current.find((item) => item.id === selectedId);
          return conversation
            ? [{ ...conversation, updatedAt: answer.createdAt }, ...current.filter((item) => item.id !== selectedId)]
            : current;
        });
      } else {
        const { conversation, question: saved, answer } = await startAssistantConversation(question);
        setSelectedId(conversation.id);
        setMessages([saved, answer]);
        setConversations((current) => [{ ...conversation, updatedAt: answer.createdAt }, ...current]);
      }
      setStatus("idle");
    } catch (error) {
      // The question goes back into the box so nothing is lost
      setMessages((current) => current.filter((message) => message.id !== pending.id));
      setDraft((current) => current || question);
      setStatus(error instanceof ApiError && error.status === 429 ? "tooMany" : "error");
    }
  }

  async function remove(id: string) {
    await deleteAssistantConversation(id).catch(() => {});
    setConversations((current) => current.filter((item) => item.id !== id));
    if (id === selectedId) openConversation(null);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(draft);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter asks, Shift+Enter is a new line; Enter that confirms a Bangla word isn't "ask"
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void ask(draft);
    }
  }

  const starters = t.raw("starters") as string[];
  const isAsking = status === "asking";
  const errorText =
    status === "error" ? t("error") : status === "tooMany" ? t("tooMany") : status === "tooLong" ? t("tooLong", { max: QUESTION_MAX_LENGTH }) : status === "loadError" ? t("loadError") : null;

  return (
    <section className="flex h-[calc(100svh-5.5rem)] min-h-112 overflow-hidden rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl md:h-[calc(100svh-7.25rem)]">
      {/* Earlier questions: wide screens only, phones start a new one or keep the open one */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-white/10 lg:flex">
        <div className="border-b border-white/10 p-3">
          <button
            type="button"
            onClick={() => openConversation(null)}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-white/85"
          >
            <PlusIcon className="size-4" />
            {t("newChat")}
          </button>
        </div>
        <p className="px-4 pt-3 text-xs font-medium text-white/45">{t("history")}</p>
        <ul data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto p-2">
          {conversations.length === 0 && <li className="px-2 py-2 text-sm text-white/50">{t("noHistory")}</li>}
          {conversations.map((conversation) => (
            <li key={conversation.id} className="group relative">
              <button
                type="button"
                onClick={() => openConversation(conversation.id)}
                aria-current={conversation.id === selectedId ? "true" : undefined}
                className={`w-full rounded-xl px-3 py-2 pr-9 text-left transition ${
                  conversation.id === selectedId ? "bg-white/15" : "hover:bg-white/5"
                }`}
              >
                <span className="line-clamp-2 text-sm">{conversation.title}</span>
                <span className="mt-0.5 block text-[11px] text-white/40">
                  {format.dateTime(new Date(conversation.updatedAt), { day: "numeric", month: "short" })}
                </span>
              </button>
              <button
                type="button"
                onClick={() => remove(conversation.id)}
                aria-label={`${t("delete")}: ${conversation.title}`}
                className="absolute right-1.5 top-2 grid size-7 place-items-center rounded-full text-white/40 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100"
              >
                <CloseIcon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/25 text-green-300">
              <SparkIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="font-semibold">{t("title")}</h1>
              <p className="truncate text-xs text-white/50">{t("note")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openConversation(null)}
            className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 lg:hidden"
          >
            {t("newChat")}
          </button>
        </header>

        <div ref={scroller} data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-6">
          {messages.length === 0 && !isAsking && (
            <div className="mx-auto flex max-w-xl flex-col items-center gap-4 pt-6 text-center">
              <p className="text-sm text-white/65">{t("intro")}</p>
              <p className="text-xs font-medium text-white/45">{t("startersTitle")}</p>
              <div className="flex flex-wrap justify-center gap-2">
                {starters.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => ask(starter)}
                    className="rounded-2xl border border-white/15 px-3.5 py-2 text-left text-sm text-white/85 transition hover:bg-white/10"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          <ol className="mx-auto flex max-w-3xl flex-col gap-3">
            {messages.map((message) => {
              const mine = message.sender === "USER";
              return (
                <li key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[85%] whitespace-pre-wrap wrap-break-word rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-white/10"
                    }`}
                  >
                    {message.content}
                  </p>
                </li>
              );
            })}
            {isAsking && (
              <li className="flex justify-start">
                <p className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white/10 px-4 py-2.5 text-sm text-white/70">
                  <span className="flex gap-1" aria-hidden>
                    {[0, 150, 300].map((delay) => (
                      <span key={delay} className="size-1.5 animate-bounce rounded-full bg-white/70" style={{ animationDelay: `${delay}ms` }} />
                    ))}
                  </span>
                  {t("thinking")}
                </p>
              </li>
            )}
          </ol>
        </div>

        <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
          {errorText && (
            <p role="alert" className="mb-2 px-1 text-xs text-red-300">
              {errorText}
            </p>
          )}
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              ref={textarea}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              data-lenis-prevent
              className="field-sizing-content max-h-36 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm leading-relaxed outline-none placeholder:text-white/40 focus:border-white/30"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isAsking}
              aria-label={t("send")}
              className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:brightness-110 disabled:opacity-40"
            >
              <SendIcon className="size-5" />
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
