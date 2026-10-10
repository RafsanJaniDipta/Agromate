"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { CloseIcon, ImageIcon, SendIcon } from "@/components/icons";
import { CHAT_PHOTOS_MAX, MESSAGE_MAX_LENGTH } from "@/lib/chat";
import { shrinkImage } from "@/lib/shrinkImage";

// "Typing…" is sent at most this often while the user keeps typing
const TYPING_EVERY_MS = 2000;
// Big enough to read a leaf spot or a label, small enough for mobile data
const PHOTO_MAX_SIDE = 1600;
const PHOTO_QUALITY = 0.85;

type Photo = { blob: Blob; previewUrl: string };
type ComposerError = "sendError" | "tooLong" | "photoError" | "tooManyPhotos";

const withPreview = (blob: Blob): Photo => ({ blob, previewUrl: URL.createObjectURL(blob) });
const freePreviews = (photos: Photo[]) => photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));

type MessageComposerProps = {
  // Resolves false when the message couldn't be sent
  onSend: (text: string, photos: Blob[]) => Promise<boolean>;
  onTyping: () => void;
};

// Message box under the chat: Enter sends, Shift+Enter starts a new line. Up to CHAT_PHOTOS_MAX
// photos can go along, with the text as their one caption. A failed message comes back into
// the box so nothing is lost.
export default function MessageComposer({ onSend, onTyping }: MessageComposerProps) {
  const t = useTranslations("chat.thread");
  const [draft, setDraft] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isPreparingPhotos, setIsPreparingPhotos] = useState(false);
  const [error, setError] = useState<ComposerError | null>(null);
  const lastTypingSent = useRef(0);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  // Read by the unmount clean-up, which only sees the first render's state
  const shownPhotos = useRef(photos);

  useEffect(() => {
    shownPhotos.current = photos;
  }, [photos]);
  useEffect(() => () => freePreviews(shownPhotos.current), []);

  async function choosePhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    // Lets the same files be picked again later
    event.target.value = "";
    if (files.length === 0) return;

    const room = CHAT_PHOTOS_MAX - photos.length;
    setError(files.length > room ? "tooManyPhotos" : null);
    if (room <= 0) return;

    setIsPreparingPhotos(true);
    try {
      const blobs = await Promise.all(
        files.slice(0, room).map((file) => shrinkImage(file, PHOTO_MAX_SIDE, PHOTO_QUALITY)),
      );
      setPhotos((current) => [...current, ...blobs.map(withPreview)]);
      textarea.current?.focus();
    } catch {
      // One of them isn't an image the browser can read
      setError("photoError");
    } finally {
      setIsPreparingPhotos(false);
    }
  }

  function removePhoto(index: number) {
    freePreviews([photos[index]!]);
    setPhotos((current) => current.filter((_, i) => i !== index));
    if (error === "tooManyPhotos") setError(null);
  }

  async function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = draft.trim();
    if (!text && photos.length === 0) return;
    if (text.length > MESSAGE_MAX_LENGTH) return setError("tooLong");

    const sentBlobs = photos.map((photo) => photo.blob);
    freePreviews(photos);
    setDraft("");
    setPhotos([]);
    setError(null);
    textarea.current?.focus();
    lastTypingSent.current = 0;

    if (await onSend(text, sentBlobs)) return;

    // Put it back unless the user has already started a new message
    setDraft((current) => current || text);
    setPhotos((current) => (current.length > 0 ? current : sentBlobs.map(withPreview)));
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
    if (error === "tooLong" || error === "sendError") setError(null);
    const now = Date.now();
    if (text.trim() && now - lastTypingSent.current > TYPING_EVERY_MS) {
      lastTypingSent.current = now;
      onTyping();
    }
  }

  const errorText: Record<ComposerError, string> = {
    tooLong: t("tooLong", { max: MESSAGE_MAX_LENGTH }),
    sendError: t("sendError"),
    photoError: t("photoError"),
    tooManyPhotos: t("tooManyPhotos", { max: CHAT_PHOTOS_MAX }),
  };
  const isFull = photos.length >= CHAT_PHOTOS_MAX;
  const placeholder = photos.length > 0 ? t("captionPlaceholder") : t("placeholder");

  return (
    <form onSubmit={submit} className="border-t border-white/10 p-3">
      {error && (
        <p role="alert" className="mb-2 px-1 text-xs text-red-300">
          {errorText[error]}
        </p>
      )}

      {photos.length > 0 && (
        <div className="mb-2">
          <p className="mb-1.5 px-1 text-xs text-white/50">
            {t("photoCount", { count: photos.length, max: CHAT_PHOTOS_MAX })}
          </p>
          {/* Scrolls sideways when the photos don't fit; pt/pr leave room for the remove buttons */}
          <ul data-lenis-prevent className="flex gap-2 overflow-x-auto pt-2 pr-2 pb-1">
            {photos.map((photo, index) => (
              <li key={photo.previewUrl} className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- a local blob preview, nothing to optimise */}
                <img
                  src={photo.previewUrl}
                  alt={t("photoPreview", { number: index + 1 })}
                  className="size-20 rounded-xl border border-white/10 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label={t("removePhoto", { number: index + 1 })}
                  className="absolute -top-2 -right-2 grid size-6 place-items-center rounded-full bg-zinc-900 text-white ring-1 ring-white/20 hover:bg-zinc-800"
                >
                  <CloseIcon className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input ref={photoInput} type="file" accept="image/*" multiple onChange={choosePhotos} className="hidden" />
        <button
          type="button"
          onClick={() => photoInput.current?.click()}
          disabled={isPreparingPhotos || isFull}
          aria-label={t("attachPhoto")}
          title={isFull ? t("tooManyPhotos", { max: CHAT_PHOTOS_MAX }) : t("attachPhoto")}
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
          placeholder={placeholder}
          aria-label={placeholder}
          data-lenis-prevent
          className="field-sizing-content max-h-36 min-h-11 min-w-0 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm leading-relaxed outline-none placeholder:text-white/40 focus:border-white/30"
        />
        <button
          type="submit"
          disabled={(!draft.trim() && photos.length === 0) || isPreparingPhotos}
          aria-label={t("send")}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:brightness-110 disabled:opacity-40"
        >
          <SendIcon className="size-5" />
        </button>
      </div>
    </form>
  );
}
