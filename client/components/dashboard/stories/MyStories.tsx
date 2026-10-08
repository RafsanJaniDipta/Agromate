"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import StoryCard from "@/components/dashboard/stories/StoryCard";
import StoryForm from "@/components/dashboard/stories/StoryForm";
import { refreshHomeStories } from "@/lib/homeStoriesCache";
import { deleteStory, getMyStories, type MyStory } from "@/lib/successStories";

type Notice = "submitted" | "updated" | "deleteError";

// The farmer's success stories: a form to share or edit one, and the list of stories already sent.
export default function MyStories() {
  const t = useTranslations("dashboard.storiesPage");
  const formTop = useRef<HTMLDivElement>(null);
  const [stories, setStories] = useState<MyStory[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [editing, setEditing] = useState<MyStory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  // Bumped after a new story is sent, so the form remounts empty
  const [formRound, setFormRound] = useState(0);

  useEffect(() => {
    getMyStories()
      .then(setStories)
      .catch(() => setLoadFailed(true));
  }, []);

  function startEditing(story: MyStory) {
    setEditing(story);
    setNotice(null);
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSaved(saved: MyStory) {
    // An edited story keeps its place; a new one goes on top
    setStories((current) =>
      editing
        ? (current ?? []).map((story) => (story.id === saved.id ? saved : story))
        : [saved, ...(current ?? [])],
    );
    setNotice(editing ? "updated" : "submitted");
    setEditing(null);
    setFormRound((round) => round + 1);
  }

  async function handleDelete(story: MyStory) {
    if (!window.confirm(t("confirmDelete"))) return;

    setDeletingId(story.id);
    try {
      await deleteStory(story.id);
      // A deleted story may have been on the home page
      void refreshHomeStories();
      setStories((current) => current?.filter(({ id }) => id !== story.id) ?? null);
      if (editing?.id === story.id) setEditing(null);
    } catch {
      setNotice("deleteError");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div ref={formTop} className="flex scroll-mt-28 flex-col gap-3">
        {notice && (
          <p
            role="status"
            className={`rounded-2xl border px-4 py-3 text-sm ${
              notice === "deleteError"
                ? "border-red-300/30 bg-red-300/10 text-red-100"
                : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
            }`}
          >
            {notice === "deleteError" ? t("deleteError") : t(`notices.${notice}`)}
          </p>
        )}
        {/* key gives each new or edited story a fresh form */}
        <StoryForm
          key={editing?.id ?? `new-${formRound}`}
          editing={editing}
          onSaved={handleSaved}
          onCancel={() => setEditing(null)}
        />
      </div>

      {/* The farmer's stories: a quiet list under the form */}
      <section className="flex flex-col gap-3">
        <h2 className="px-1 text-lg font-semibold">{t("listTitle")}</h2>

        {loadFailed && <p className="px-1 text-sm text-red-300">{t("loadError")}</p>}
        {!loadFailed && !stories && <p className="px-1 text-sm text-white/50">{t("loading")}</p>}
        {stories?.length === 0 && <p className="px-1 text-sm text-white/50">{t("empty")}</p>}

        {stories && stories.length > 0 && (
          <ul className="flex flex-col divide-y divide-white/10 rounded-3xl border border-white/10 bg-black/40 px-5 backdrop-blur-xl">
            {stories.map((story) => (
              <li key={story.id}>
                <StoryCard
                  story={story}
                  isDeleting={deletingId === story.id}
                  onEdit={() => startEditing(story)}
                  onDelete={() => handleDelete(story)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
