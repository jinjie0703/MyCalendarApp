import { useCallback, useMemo, useState } from "react";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}

function formatMonth(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  return `${y}-${m}`;
}

export type ChangeMonthDirection = "left" | "right";

/**
 * Minimal calendar state hook used by app/(tabs)/calendar.tsx.
 * Keeps `currentMonth` as YYYY-MM and `today`/selected dates as YYYY-MM-DD.
 */
export function useCalendar() {
  const today = useMemo(() => formatDate(new Date()), []);

  const [currentMonth, setCurrentMonth] = useState(() => formatMonth(new Date()));

  const changeMonth = useCallback(
    (direction: ChangeMonthDirection) => {
      setCurrentMonth((prev) => {
        const [yStr, mStr] = prev.split("-");
        const y = Number(yStr);
        const m = Number(mStr);
        const base = new Date(y, m - 1, 1);
        base.setMonth(base.getMonth() + (direction === "right" ? 1 : -1));
        return formatMonth(base);
      });
    },
    [setCurrentMonth]
  );

  return { today, currentMonth, setCurrentMonth, changeMonth };
}

