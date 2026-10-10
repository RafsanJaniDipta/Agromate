"use client";

import { useCallback, useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import Pager from "@/components/dashboard/Pager";
import { secondaryButton } from "@/components/dashboard/formStyles";
import { HelpIcon } from "@/components/icons";
import { getSupportTickets, updateSupportTicketStatus, type SupportTicket } from "@/lib/admin";

const PAGE_SIZE = 10;

export default function SupportTicketsManager() {
  const t = useTranslations("admin.supportTickets");
  const format = useFormatter();

  const [tickets, setTickets] = useState<SupportTicket[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback((pageToLoad: number, filterStatus: string) => {
    getSupportTickets(pageToLoad, PAGE_SIZE, filterStatus === "ALL" ? "" : filterStatus)
      .then(({ data, meta }) => {
        setTickets(data);
        setTotal(meta.total);
        setPage(pageToLoad);
        // Cleared here rather than before the request: an effect calls load, and
        // effects mustn't set state synchronously
        setFailed(false);
      })
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    load(1, statusFilter);
  }, [load, statusFilter]);

  async function handleStatusChange(ticket: SupportTicket, newStatus: "OPEN" | "RESOLVED") {
    setBusyId(ticket.id);
    setFailed(false);
    try {
      await updateSupportTicketStatus(ticket.id, newStatus);
      load(page, statusFilter);
    } catch {
      setFailed(true);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashCard>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <CardHeader icon={<HelpIcon />} title={t("title")} />
        <div className="flex items-center gap-1 rounded-2xl bg-black/40 p-1 text-xs">
          {(["OPEN", "RESOLVED", "ALL"] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-xl px-3 py-1.5 font-medium transition-colors ${
                statusFilter === st ? "bg-white/20 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {t(`filters.${st}`)}
            </button>
          ))}
        </div>
      </div>

      {failed && <p className="mt-4 text-sm text-red-300">{t("error")}</p>}
      {!tickets && !failed && <p className="mt-4 text-sm text-white/60">{t("loading")}</p>}

      {tickets && tickets.length === 0 && (
        <p className="mt-6 text-center text-sm text-white/50">{t("empty")}</p>
      )}

      {tickets && tickets.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="text-xs text-white/50">
              <tr>
                <th className="py-2 font-medium">{t("columns.sender")}</th>
                <th className="py-2 font-medium">{t("columns.topic")}</th>
                <th className="py-2 font-medium">{t("columns.status")}</th>
                <th className="py-2 font-medium">{t("columns.date")}</th>
                <th className="py-2 font-medium text-right">{t("columns.action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {tickets.map((ticket) => {
                const busy = busyId === ticket.id;
                const isOpen = ticket.status === "OPEN";

                return (
                  <tr key={ticket.id}>
                    <td className="py-3 pr-3">
                      <div className="font-medium text-white">{ticket.name}</div>
                      <div className="text-xs text-white/60">{ticket.phone}</div>
                      {ticket.user && (
                        <span className="mt-1 inline-block rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                          {t("linkedUser", { name: ticket.user.name })}
                        </span>
                      )}
                    </td>
                    <td className="max-w-xs py-3 pr-3">
                      <div className="font-medium text-emerald-400 text-xs uppercase tracking-wider mb-0.5">
                        {ticket.topic}
                      </div>
                      <p className="line-clamp-2 text-xs text-white/80 whitespace-pre-wrap">{ticket.message}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          isOpen ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {isOpen ? t("filters.OPEN") : t("filters.RESOLVED")}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-xs text-white/60">
                      {format.dateTime(new Date(ticket.createdAt), { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleStatusChange(ticket, isOpen ? "RESOLVED" : "OPEN")}
                        className={`${secondaryButton} px-3 py-1 text-xs disabled:opacity-50 ${
                          isOpen ? "border-emerald-400/40 text-emerald-300" : "border-amber-400/40 text-amber-300"
                        }`}
                      >
                        {isOpen ? t("resolve") : t("reopen")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tickets && <Pager page={page} limit={PAGE_SIZE} total={total} onChange={(p) => load(p, statusFilter)} />}
    </DashCard>
  );
}
