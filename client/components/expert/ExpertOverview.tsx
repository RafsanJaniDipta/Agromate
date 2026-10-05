"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChatIcon, CheckIcon, ShieldIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import StatCard from "@/components/dashboard/StatCard";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import QuestionItem from "@/components/expert/QuestionItem";
import {
  countAnsweredQuestions,
  getOpenQuestions,
  getOwnProfile,
  type ExpertStatus,
  type OpenQuestion,
} from "@/lib/expert";

type Overview = {
  status: ExpertStatus | null;
  openQuestions: OpenQuestion[];
  openTotal: number;
  answeredTotal: number;
};

const statusColors: Record<ExpertStatus | "NONE", string> = {
  VERIFIED: "text-green-400",
  PENDING: "text-amber-300",
  REJECTED: "text-red-400",
  NONE: "text-white/70",
};

// Expert home: verification status, question counts and the queue of questions to answer.
export default function ExpertOverview() {
  const t = useTranslations("expertDashboard");
  const user = useCurrentUser();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    Promise.all([getOwnProfile(), getOpenQuestions(), countAnsweredQuestions()])
      .then(([profile, open, answeredTotal]) =>
        setOverview({
          status: profile?.status ?? null,
          openQuestions: open.questions,
          openTotal: open.total,
          answeredTotal,
        }),
      )
      .catch(() => setFailed(true));
  }, []);

  // An answered question leaves the queue and moves to the answered count
  function handleAnswered(questionId: string) {
    setOverview((current) =>
      current && {
        ...current,
        openQuestions: current.openQuestions.filter((q) => q.id !== questionId),
        openTotal: current.openTotal - 1,
        answeredTotal: current.answeredTotal + 1,
      },
    );
  }

  const statusKey = overview?.status ?? "NONE";
  const canAnswer = overview?.status === "VERIFIED";

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold md:text-3xl">{t("greeting", { name: user.name })}</h1>

      {failed && <p className="text-sm text-red-300">{t("loadError")}</p>}

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={<ShieldIcon />} title={t("stats.status")}>
          <p className={`text-xl font-semibold ${statusColors[statusKey]}`}>
            {overview ? t(`status.${statusKey}`) : "…"}
          </p>
        </StatCard>
        <StatCard icon={<ChatIcon />} title={t("stats.open")}>
          <p className="text-3xl font-semibold">{overview?.openTotal ?? "…"}</p>
        </StatCard>
        <StatCard icon={<CheckIcon />} title={t("stats.answered")}>
          <p className="text-3xl font-semibold">{overview?.answeredTotal ?? "…"}</p>
        </StatCard>
      </div>

      {overview && statusKey !== "VERIFIED" && (
        <p className="rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          {t(`statusNote.${statusKey}`)}
        </p>
      )}

      <DashCard>
        <CardHeader icon={<ChatIcon />} title={t("queue.title")} />
        {overview?.openQuestions.length === 0 && (
          <p className="mt-4 text-sm text-white/60">{t("queue.empty")}</p>
        )}
        <ul className="mt-4 flex flex-col gap-3">
          {overview?.openQuestions.map((question) => (
            <QuestionItem
              key={question.id}
              question={question}
              canAnswer={canAnswer}
              onAnswered={handleAnswered}
            />
          ))}
        </ul>
      </DashCard>
    </div>
  );
}
