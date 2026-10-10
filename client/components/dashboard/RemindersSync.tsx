"use client";

import { createContext, useCallback, useContext, useState } from "react";

// Lets dashboard cards that show reminders stay in step: one card reports a change,
// the others read `version` and reload when it goes up.
type RemindersSync = { version: number; notifyChanged: () => void };

// Outside the provider nothing is shared: version stays 0 and changes go unannounced
const RemindersSyncContext = createContext<RemindersSync>({ version: 0, notifyChanged: () => {} });

export function RemindersSyncProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const notifyChanged = useCallback(() => setVersion((current) => current + 1), []);

  return <RemindersSyncContext.Provider value={{ version, notifyChanged }}>{children}</RemindersSyncContext.Provider>;
}

export const useRemindersSync = () => useContext(RemindersSyncContext);
