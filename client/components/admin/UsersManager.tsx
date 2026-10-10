"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { UserIcon } from "@/components/icons";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import Pager from "@/components/dashboard/Pager";
import { secondaryButton } from "@/components/dashboard/formStyles";
import { useCurrentUser } from "@/components/dashboard/RoleGate";
import { getUsers, updateUser, type AdminUser } from "@/lib/admin";
import { toRole, type Role } from "@/lib/session";

const ROLES: Role[] = ["FARMER", "EXPERT", "ADMIN"];
const PAGE_SIZE = 10;

// Every account with its role and access. The server refuses changes to admins
// (including yourself), so their controls are disabled.
export default function UsersManager() {
  const t = useTranslations("admin.users");
  const tRoles = useTranslations("roles");
  const format = useFormatter();
  const me = useCurrentUser();
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback((pageToLoad: number) => {
    getUsers(pageToLoad, PAGE_SIZE)
      .then(({ data, meta }) => {
        setUsers(data);
        setTotal(meta.total);
        setPage(pageToLoad);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => load(1), [load]);

  async function change(user: AdminUser, update: Parameters<typeof updateUser>[1]) {
    setBusyId(user.id);
    setFailed(false);
    try {
      await updateUser(user.id, update);
      load(page);
    } catch {
      setFailed(true);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashCard>
      <CardHeader icon={<UserIcon />} title={t("title")} />
      {failed && <p className="mt-4 text-sm text-red-300">{t("error")}</p>}
      {!users && !failed && <p className="mt-4 text-sm text-white/60">{t("loading")}</p>}

      {users && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="text-xs text-white/50">
              <tr>
                <th className="py-2 font-medium">{t("columns.name")}</th>
                <th className="py-2 font-medium">{t("columns.contact")}</th>
                <th className="py-2 font-medium">{t("columns.role")}</th>
                <th className="py-2 font-medium">{t("columns.joined")}</th>
                <th className="py-2 font-medium">{t("columns.access")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => {
                const role = toRole(user.role);
                const locked = role === "ADMIN" || user.id === me.id;
                const busy = busyId === user.id;
                return (
                  <tr key={user.id}>
                    <td className="py-3 pr-3 font-medium">{user.name}</td>
                    <td className="py-3 pr-3 text-white/70">{user.phone ?? user.email}</td>
                    <td className="py-3 pr-3">
                      <label className="sr-only" htmlFor={`role-${user.id}`}>
                        {t("columns.role")}
                      </label>
                      <select
                        id={`role-${user.id}`}
                        value={role}
                        disabled={locked || busy}
                        onChange={(event) => change(user, { role: event.target.value as Role })}
                        className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm disabled:opacity-50"
                      >
                        {ROLES.map((option) => (
                          <option key={option} value={option}>
                            {tRoles(option)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 pr-3 text-white/70">{format.dateTime(new Date(user.createdAt), { dateStyle: "medium" })}</td>
                    <td className="py-3">
                      {locked ? (
                        <span className="text-xs text-white/40">—</span>
                      ) : (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => change(user, { status: user.banned ? "ACTIVE" : "BANNED" })}
                          className={`${secondaryButton} px-3 py-1.5 text-xs ${user.banned ? "border-red-300/40 text-red-200" : ""}`}
                        >
                          {user.banned ? t("unban") : t("ban")}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {users && <Pager page={page} limit={PAGE_SIZE} total={total} onChange={load} />}
    </DashCard>
  );
}
