"use client";

import { useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import CardHeader from "@/components/dashboard/CardHeader";
import DashCard from "@/components/dashboard/DashCard";
import { useRemindersSync } from "@/components/dashboard/RemindersSync";
import { BellIcon, CalendarIcon, CloseIcon, PencilIcon, SproutIcon, WheatIcon } from "@/components/icons";
import ReminderEditForm from "@/components/dashboard/ReminderEditForm";
import { Link } from "@/i18n/navigation";
import { getCalendarEvents } from "@/lib/calendar";
import { ACTIVE_STATUSES, toDateInput, todayDateInput } from "@/lib/cropCycles";
import { cropName } from "@/lib/crops";
import { deleteReminder } from "@/lib/reminders";

// How far ahead the card looks, and how many events it lists
const DAYS_AHEAD = 30;
const MAX_EVENTS = 6;
const DAY_MS = 24 * 60 * 60 * 1000;

type EventKind = "plant" | "harvest" | "reminder";

// `reminder` is set for reminders, which can be edited and deleted here; crop events are managed on the crops page
type UpcomingEvent = {
  id: string;
  kind: EventKind;
  day: string;
  title: string;
  place?: string;
  reminder?: { id: string; title: string; dueDate: string };
};

const kindIcons: Record<EventKind, typeof BellIcon> = {
  plant: SproutIcon,
  harvest: WheatIcon,
  reminder: BellIcon,
};

// "YYYY-MM-DD" a number of days from today
const daysFromToday = (days: number) => toDateInput(new Date(Date.now() + days * DAY_MS).toISOString());

// The next month at a glance: crops to plant, harvests due and reminders, soonest first.
// Today's reminders live in the tasks card, so this list starts tomorrow for those.
export default function UpcomingCard() {
  const t = useTranslations("dashboard.upcoming");
  const format = useFormatter();
  const locale = useLocale();
  const [events, setEvents] = useState<UpcomingEvent[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  // Goes up when the tasks card adds a reminder, so the list reloads right away
  const { version: remindersVersion, notifyChanged } = useRemindersSync();
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    // Ignores an older answer that arrives after a newer reload started
    let isCurrent = true;
    const today = todayDateInput();
    getCalendarEvents(today, daysFromToday(DAYS_AHEAD))
      .then(({ cropCycles, reminders }) => {
        const inRange = (day: string) => day >= today && day <= daysFromToday(DAYS_AHEAD);

        const plantings = cropCycles
          .filter((cycle) => cycle.status === "PLANNED" && inRange(toDateInput(cycle.plantingDate)))
          .map((cycle) => ({
            id: `plant-${cycle.id}`,
            kind: "plant" as const,
            day: toDateInput(cycle.plantingDate),
            title: cropName(cycle.crop, locale),
            place: cycle.field.name,
          }));
        const harvests = cropCycles
          .filter((cycle) => ACTIVE_STATUSES.includes(cycle.status) && cycle.expectedHarvestDate)
          .map((cycle) => ({
            id: `harvest-${cycle.id}`,
            kind: "harvest" as const,
            day: toDateInput(cycle.expectedHarvestDate),
            title: cropName(cycle.crop, locale),
            place: cycle.field.name,
          }))
          .filter((event) => inRange(event.day));
        const laterReminders = reminders
          .filter((reminder) => !reminder.isDone && toDateInput(reminder.dueDate) > today)
          .map((reminder) => ({
            id: `reminder-${reminder.id}`,
            reminder: { id: reminder.id, title: reminder.title, dueDate: reminder.dueDate },
            kind: "reminder" as const,
            day: toDateInput(reminder.dueDate),
            title: reminder.title,
          }));

        if (!isCurrent) return;
        setEvents(
          [...plantings, ...harvests, ...laterReminders]
            .sort((a, b) => a.day.localeCompare(b.day))
            .slice(0, MAX_EVENTS),
        );
        setLoadFailed(false);
      })
      .catch(() => isCurrent && setLoadFailed(true));
    return () => {
      isCurrent = false;
    };
  }, [locale, remindersVersion]);

  // Reloading afterwards lets the next event move up into the freed spot
  async function removeReminder(id: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    try {
      await deleteReminder(id);
      setDeleteFailed(false);
      notifyChanged();
    } catch {
      setDeleteFailed(true);
    }
  }

  // "Today", "Tomorrow", "In 5 days" for the coming week, a date after that
  function whenLabel(day: string) {
    const days = Math.round((Date.parse(day) - Date.parse(todayDateInput())) / DAY_MS);
    if (days <= 7) return t("inDays", { days });
    return format.dateTime(new Date(day), { day: "numeric", month: "short" });
  }

  return (
    <DashCard className="flex flex-col gap-4">
      <CardHeader icon={<CalendarIcon />} title={t("title")} />

      {loadFailed && <p className="text-sm text-red-300">{t("loadError")}</p>}
      {!loadFailed && !events && <p className="text-sm text-white/60">{t("loading")}</p>}
      {events?.length === 0 && <p className="text-sm text-white/60">{t("empty", { days: DAYS_AHEAD })}</p>}
      {deleteFailed && <p className="text-sm text-red-300">{t("deleteError")}</p>}

      {events && events.length > 0 && (
        <ul className="flex flex-col gap-1">
          {events.map(({ id, kind, day, title, place, reminder }) => {
            const Icon = kindIcons[kind];
            const content = (
              <>
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10">
                  <Icon className="size-4.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{t(`kinds.${kind}`, { title })}</span>
                  {place && <span className="block truncate text-xs text-white/50">{place}</span>}
                </span>
                <span className="shrink-0 text-xs text-white/70">{whenLabel(day)}</span>
              </>
            );

            if (reminder && editingId === reminder.id) {
              return (
                <li key={id} className="py-1">
                  <ReminderEditForm
                    reminder={reminder}
                    onSaved={() => {
                      setEditingId(null);
                      // Reload: the reminder may have moved to another day or out of range
                      notifyChanged();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </li>
              );
            }

            return (
              <li key={id} className="flex items-center gap-1">
                {reminder ? (
                  <>
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-2">{content}</div>
                    <button
                      type="button"
                      onClick={() => setEditingId(reminder.id)}
                      aria-label={t("editReminder", { title })}
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
                    >
                      <PencilIcon className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeReminder(reminder.id)}
                      aria-label={t("deleteReminder", { title })}
                      className="grid size-7 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-red-300"
                    >
                      <CloseIcon className="size-4" />
                    </button>
                  </>
                ) : (
                  // Plantings and harvests come from the crop records, so they are changed there
                  <Link
                    href="/dashboard/my-crops"
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-2 transition hover:bg-white/5"
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </DashCard>
  );
}
