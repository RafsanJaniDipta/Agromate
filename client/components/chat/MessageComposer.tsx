"use client";

import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { SendIcon } from "@/components/icons";
import { MESSAGE_MAX_LENGTH } from "@/lib/chat";

// "Typing…" is sent at most this often while the user keeps typing
const TYPING_EVERY_MS = 2000;

type MessageComposerProps = {
  // Resolves false when the message couldn't be sent
  onSend: (text: string) => Promise<boolean>;
  onTyping: () => void;
};

// Message box under the chat: Enter sends, Shift+Enter starts a new line.
// A failed message comes back into the box so nothing is lost.
export default function MessageComposer({ onSend, onTyping }: MessageComposerProps) {
  const t = useTranslations("chat.thread");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<"sendError" | "tooLong" | null>(null);
  const lastTypingSent = useRef(0);
  const textarea = useRef<HTMLTextAreaElement>(null);

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    if (text.length > MESSAGE_MAX_LENGTH) return setError("tooLong");

    setDraft("");
    setError(null);
    textarea.current?.focus();
    lastTypingSent.current = 0;

    if (!(await onSend(text))) {
      // Put it back unless the user has already started a new message
      setDraft((current) => current || text);
      setError("sendError");
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing: Enter that confirms a word in a Bangla (or other) input method isn't "send"
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  }

  function handleChange(text: string) {
    setDraft(text);
    if (error) setError(null);
    const now = Date.now();
    if (text.trim() && now - lastTypingSent.current > TYPING_EVERY_MS) {
      lastTypingSent.current = now;
      onTyping();
    }
  }

  return (
    <form onSubmit={submit} className="border-t border-white/10 p-3">
      {error && (
        <p role="alert" className="mb-2 px-1 text-xs text-red-300">
          {error === "tooLong" ? t("tooLong", { max: MESSAGE_MAX_LENGTH }) : t("sendError")}
        </p>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textarea}
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={t("placeholder")}
          aria-label={t("placeholder")}
          data-lenis-prevent
          className="field-sizing-content max-h-36 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm leading-relaxed outline-none placeholder:text-white/40 focus:border-white/30"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          aria-label={t("send")}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:brightness-110 disabled:opacity-40"
        >
          <SendIcon className="size-5" />
        </button>
      </div>
    </form>
  );
}
