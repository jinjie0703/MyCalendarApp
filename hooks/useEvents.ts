import { useMemo } from "react";

export type CalendarEvent = {
  date: string; // YYYY-MM-DD
  color?: string;
};

/**
 * Minimal placeholder hook to satisfy imports used by app/(tabs)/calendar.tsx.
 * Replace with your real DB-backed implementation later.
 */
export function useEvents(_currentMonth: string) {
  const events = useMemo<CalendarEvent[]>(() => [], []);
  return { events };
}

