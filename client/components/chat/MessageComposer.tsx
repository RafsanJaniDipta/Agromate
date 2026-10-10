"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { CloseIcon, ImageIcon, SendIcon } from "@/components/icons";
import { MESSAGE_MAX_LENGTH } from "@/lib/chat";
import { shrinkImage } from "@/lib/shrinkImage";

// "Typing…" is sent at most this often while the user keeps typing
const TYPING_EVERY_MS = 2000;
// Big enough to read a leaf spot or a label, small enough for mobile data
const PHOTO_MAX_SIDE = 1600;
const PHOTO_QUALITY = 0.85;

type Photo = { blob: Blob; previewUrl: string };
type ComposerError = "sendError" | "tooLong" | "photoError";

type MessageComposerProps = {
  // Resolves false when the message couldn't be sent
  onSend: (text: string, photo?: Blob) => Promise<boolean>;
  onTyping: () => void;
};

// Message box under the chat: Enter sends, Shift+Enter starts a new line. A photo can go
// with the text as its caption. A failed message comes back into the box so nothing is lost.
export default function MessageComposer({ onSend, onTyping }: MessageComposerProps) {
  const t = useTranslations("chat.thread");
  const [draft, setDraft] = useState("");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [isPreparingPhoto, setIsPreparingPhoto] = useState(false);
  const [error, setError] = useState<ComposerError | null>(null);
  const lastTypingSent = useRef(0);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);

  // Frees the preview's memory when it's replaced or the chat closes
  useEffect(() => {
    if (!photo) return;
    return () => URL.revokeObjectURL(photo.previewUrl);
  }, [photo]);

  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Lets the same file be picked again after removing it
    event.target.value = "";
    if (!file) return;

    setIsPreparingPhoto(true);
    setError(null);
    try {
      const blob = await shrinkImage(file, PHOTO_MAX_SIDE, PHOTO_QUALITY);
      setPhoto({ blob, previewUrl: URL.createObjectURL(blob) });
      textarea.current?.focus();
    } catch {
      // Not an image the browser can read
      setError("photoError");
    } finally {
      setIsPreparingPhoto(false);
    }
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text && !photo) return;
    if (text.length > MESSAGE_MAX_LENGTH) return setError("tooLong");

    const sentPhoto = photo;
    setDraft("");
    // Kept alive until we know the send worked, so a failed photo can come back
    setPhoto(null);
    setError(null);
    textarea.current?.focus();
    lastTypingSent.current = 0;

    if (await onSend(text, sentPhoto?.blob)) return;

    // Put it back unless the user has already started a new message
    setDraft((current) => current || text);
    if (sentPhoto) {
      setPhoto((current) => current ?? { blob: sentPhoto.blob, previewUrl: URL.createObjectURL(sentPhoto.blob) });
    }
    setError("sendError");
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

  const errorText = {
    tooLong: t("tooLong", { max: MESSAGE_MAX_LENGTH }),
    sendError: t("sendError"),
    photoError: t("photoError"),
  };

  return (
    <form onSubmit={submit} className="border-t border-white/10 p-3">
      {error && (
        <p role="alert" className="mb-2 px-1 text-xs text-red-300">
          {errorText[error]}
        </p>
      )}

      {photo && (
        <div className="relative mb-2 w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview, nothing to optimise */}
          <img src={photo.previewUrl} alt={t("photoPreview")} className="max-h-40 rounded-2xl border border-white/10" />
          <button
            type="button"
            onClick={() => setPhoto(null)}
            aria-label={t("removePhoto")}
            className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full bg-zinc-900 text-white ring-1 ring-white/20 hover:bg-zinc-800"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input ref={photoInput} type="file" accept="image/*" onChange={choosePhoto} className="hidden" />
        <button
          type="button"
          onClick={() => photoInput.current?.click()}
          disabled={isPreparingPhoto}
          aria-label={t("attachPhoto")}
          title={t("attachPhoto")}
          className="grid size-11 shrink-0 place-items-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <ImageIcon className="size-5" />
        </button>
        <textarea
          ref={textarea}
          value={draft}
          onChange={(event) => handleChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={photo ? t("captionPlaceholder") : t("placeholder")}
          aria-label={photo ? t("captionPlaceholder") : t("placeholder")}
          data-lenis-prevent
          className="field-sizing-content max-h-36 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm leading-relaxed outline-none placeholder:text-white/40 focus:border-white/30"
        />
        <button
          type="submit"
          disabled={(!draft.trim() && !photo) || isPreparingPhoto}
          aria-label={t("send")}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:brightness-110 disabled:opacity-40"
        >
          <SendIcon className="size-5" />
        </button>
      </div>
    </form>
  );
}
