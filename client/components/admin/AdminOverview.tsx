"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BarnIcon, LeafIcon, SproutIcon, UserIcon } from "@/components/icons";
import StatCard from "@/components/dashboard/StatCard";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import ExpertApplications from "@/components/admin/ExpertApplications";
import { getAdminStats, type AdminStats } from "@/lib/admin";

const statCards: { key: keyof AdminStats; Icon: typeof UserIcon }[] = [
  { key: "totalUsers", Icon: UserIcon },
  { key: "totalFarms", Icon: BarnIcon },
  { key: "totalCropCycles", Icon: SproutIcon },
  { key: "totalDiseaseDetections", Icon: LeafIcon },
];

// Admin home: platform-wide numbers and the expert applications waiting for review.
export default function AdminOverview() {
  const t = useTranslations("admin.home");
  const user = useCurrentUser();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setFailed(true));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold md:text-3xl">{t("greeting", { name: user.name })}</h1>
      {failed && <p className="text-sm text-red-300">{t("error")}</p>}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, Icon }) => (
          <StatCard key={key} icon={<Icon />} title={t(`stats.${key}`)}>
            <p className="text-3xl font-semibold">{stats?.[key] ?? "…"}</p>
          </StatCard>
        ))}
      </div>

      <ExpertApplications />
    </div>
  );
}
