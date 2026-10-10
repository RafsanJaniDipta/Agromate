"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import { primaryButton } from "@/components/dashboard/formStyles";
import { MessagesIcon } from "@/components/icons";
import { broadcastNotification } from "@/lib/admin";

export default function BroadcastNotificationForm() {
  const t = useTranslations("admin.broadcast");
  const [role, setRole] = useState<string>("");
  const [type, setType] = useState<"INFO" | "SUCCESS" | "ALERT">("INFO");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await broadcastNotification({
        role: role || undefined,
        type,
        title: title.trim(),
        message: message.trim(),
      });

      setFeedback({
        success: true,
        text: t("success", { count: res.count }),
      });
      setTitle("");
      setMessage("");
    } catch {
      setFeedback({
        success: false,
        text: t("error"),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashCard>
      <CardHeader icon={<MessagesIcon />} title={t("title")} />
      <p className="mt-1 text-xs text-white/60">{t("subtitle")}</p>

      {feedback && (
        <div
          className={`mt-4 rounded-xl p-3 text-sm ${
            feedback.success
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              : "bg-red-500/10 text-red-300 border border-red-500/20"
          }`}
        >
          {feedback.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="broadcast-role" className="mb-1 block text-xs font-medium text-white/70">
              {t("targetRole")}
            </label>
            <select
              id="broadcast-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="">{t("allRoles")}</option>
              <option value="FARMER">Farmers (কৃষক)</option>
              <option value="EXPERT">Experts (বিশেষজ্ঞ)</option>
              <option value="ADMIN">Admins (অ্যাডমিন)</option>
            </select>
          </div>

          <div>
            <label htmlFor="broadcast-type" className="mb-1 block text-xs font-medium text-white/70">
              {t("type")}
            </label>
            <select
              id="broadcast-type"
              value={type}
              onChange={(e) => setType(e.target.value as "INFO" | "SUCCESS" | "ALERT")}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="INFO">Information (তথ্য)</option>
              <option value="SUCCESS">Success (সফলতা)</option>
              <option value="ALERT">Alert / Warning (সতর্কতা)</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="broadcast-title" className="mb-1 block text-xs font-medium text-white/70">
            {t("notificationTitle")}
          </label>
          <input
            id="broadcast-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("notificationTitle")}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div>
          <label htmlFor="broadcast-message" className="mb-1 block text-xs font-medium text-white/70">
            {t("message")}
          </label>
          <textarea
            id="broadcast-message"
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("message")}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-white/40"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !title.trim() || !message.trim()}
            className={`${primaryButton} px-5 py-2 text-sm disabled:opacity-50`}
          >
            {submitting ? t("sending") : t("send")}
          </button>
        </div>
      </form>
    </DashCard>
  );
}
