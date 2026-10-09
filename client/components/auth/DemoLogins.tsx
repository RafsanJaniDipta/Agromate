"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ExpertIcon, ShieldIcon, SproutIcon } from "@/components/icons";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { dashboardFor } from "@/lib/session";

export type DemoRole = "farmer" | "expert" | "admin";

const icons: Record<DemoRole, React.ComponentType<{ className?: string }>> = {
  farmer: SproutIcon,
  expert: ExpertIcon,
  admin: ShieldIcon,
};

// One-click logins into the demo accounts. The server keeps their passwords and says which
// ones exist, so nothing shows when none are set up. `offer` picks the roles for this page
// (the farmer login page offers farmer and expert, the staff page admin).
export default function DemoLogins({ offer }: { offer: DemoRole[] }) {
  const t = useTranslations("auth.login.demo");
  const router = useRouter();
  // Roles the server has demo accounts for
  const [available, setAvailable] = useState<DemoRole[]>([]);
  const [signingIn, setSigningIn] = useState<DemoRole | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api<{ data: DemoRole[] }>("/api/auth/demo-login")
      .then(({ data }) => setAvailable(data))
      .catch(() => {}); // no demo buttons, the normal form still works
  }, []);

  const roles = offer.filter((role) => available.includes(role));

  async function signIn(role: DemoRole) {
    setSigningIn(role);
    setFailed(false);
    try {
      const { data } = await api<{ data: { role: string } }>("/api/auth/demo-login", {
        method: "POST",
        body: JSON.stringify({ role }),
      });
      router.push(dashboardFor(data.role));
    } catch {
      setFailed(true);
      setSigningIn(null);
    }
  }

  if (roles.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span className="h-px flex-1 bg-zinc-200" />
        {t("demoTitle")}
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <div className={`mt-4 grid gap-3 ${roles.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {roles.map((role) => {
          const Icon = icons[role];
          return (
            <button
              key={role}
              type="button"
              onClick={() => signIn(role)}
              disabled={signingIn !== null}
              className="flex items-center justify-center gap-2 rounded-full border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-800 transition hover:border-brand hover:bg-brand/5 disabled:opacity-60"
            >
              <Icon className="size-5 text-brand" />
              {signingIn === role ? t("signingIn") : t(role)}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="mt-3 text-sm text-red-600">
        {failed && t("error")}
      </p>
    </div>
  );
}
