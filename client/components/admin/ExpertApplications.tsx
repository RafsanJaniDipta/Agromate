"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ShieldIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import { primaryButton, secondaryButton } from "@/components/dashboard/formStyles";
import { getPendingExperts, reviewExpert, type ExpertApplication } from "@/lib/admin";

// Expert sign-ups waiting for an admin; approving lets them answer farmers' questions.
export default function ExpertApplications() {
  const t = useTranslations("admin.experts");
  const [applications, setApplications] = useState<ExpertApplication[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    getPendingExperts()
      .then(setApplications)
      .catch(() => setFailed(true));
  }, []);

  async function decide(userId: string, status: "VERIFIED" | "REJECTED") {
    setBusyId(userId);
    try {
      await reviewExpert(userId, status);
      setApplications((list) => list?.filter((item) => item.userId !== userId) ?? null);
    } catch {
      setFailed(true);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashCard>
      <CardHeader icon={<ShieldIcon />} title={t("title")} />

      {failed && <p className="mt-4 text-sm text-red-300">{t("error")}</p>}
      {!applications && !failed && <p className="mt-4 text-sm text-white/60">{t("loading")}</p>}
      {applications?.length === 0 && <p className="mt-4 text-sm text-white/60">{t("empty")}</p>}

      <ul className="mt-4 grid gap-3 lg:grid-cols-2">
        {applications?.map((item) => (
          <li key={item.userId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium">{item.user.name}</p>
            <p className="mt-1 text-sm text-white/70">
              {item.specialization}
              {item.organization && ` · ${item.organization}`}
              {" · "}
              {t("years", { count: item.experienceYears })}
            </p>
            {item.user.phone && <p className="mt-1 text-xs text-white/50">{item.user.phone}</p>}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busyId === item.userId}
                onClick={() => decide(item.userId, "VERIFIED")}
                className={primaryButton}
              >
                {t("approve")}
              </button>
              <button
                type="button"
                disabled={busyId === item.userId}
                onClick={() => decide(item.userId, "REJECTED")}
                className={secondaryButton}
              >
                {t("reject")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </DashCard>
  );
}
