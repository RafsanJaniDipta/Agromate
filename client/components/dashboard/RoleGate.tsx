"use client";

import { createContext, useContext } from "react";
import { useTranslations } from "next-intl";
import { useRoleGuard, type CurrentUser, type Role } from "@/lib/session";

const CurrentUserContext = createContext<CurrentUser | null>(null);

// The signed-in user, for components inside a RoleGate
export function useCurrentUser(): CurrentUser {
  const user = useContext(CurrentUserContext);
  if (!user) throw new Error("useCurrentUser must be used inside a RoleGate");
  return user;
}

// Renders its children only for `role`. Until the check finishes nothing private is shown;
// logged-out visitors and other roles are redirected by useRoleGuard.
export default function RoleGate({ role, children }: { role: Role; children: React.ReactNode }) {
  const t = useTranslations("dashboard");
  const { user, failed } = useRoleGuard(role);

  if (!user) {
    return (
      <p role="status" className="py-24 text-center text-sm text-white/70">
        {failed ? t("loadError") : t("checkingAccess")}
      </p>
    );
  }

  return <CurrentUserContext.Provider value={user}>{children}</CurrentUserContext.Provider>;
}
